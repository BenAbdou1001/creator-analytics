"""Data access shared by the REST API and the MCP server.

Generic CRUD is driven by Postgres catalog introspection, so every table and
view of the `creator` schema is reachable without per-table code. Identifiers
are only ever taken from the catalog; values are always bound parameters.
"""

import atexit
import csv
import hashlib
import io
import os
import re
from functools import cache
from typing import Any

from psycopg import sql
from psycopg.types.json import Jsonb
from psycopg.types.numeric import FloatLoader
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://creator:creator@localhost:5433/creator")


def _configure(conn):
    conn.adapters.register_loader("numeric", FloatLoader)  # JSON-friendly numbers


pool = ConnectionPool(
    DATABASE_URL,
    kwargs={"row_factory": dict_row, "options": "-c search_path=creator,public"},
    configure=_configure,
    open=True,
)
atexit.register(pool.close)


class NotFound(LookupError):
    pass


def query(q, params=None) -> list[dict]:
    with pool.connection() as conn:
        return conn.execute(q, params).fetchall()


# ---------------------------------------------------------------------------
# Introspection
# ---------------------------------------------------------------------------
@cache
def schema() -> dict:
    cols = query("""
        SELECT c.relname AS table, c.relkind = 'v' AS is_view, a.attname AS name,
               format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS required,
               pg_get_expr(d.adbin, d.adrelid) AS default,
               array_position(i.indkey::smallint[], a.attnum) AS pk_pos
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
        LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
        LEFT JOIN pg_index i ON i.indrelid = c.oid AND i.indisprimary
        WHERE n.nspname = 'creator' AND c.relkind IN ('r', 'v')
        ORDER BY c.relname, a.attnum""")
    tables: dict[str, dict] = {}
    for c in cols:
        t = tables.setdefault(c["table"], {"view": c["is_view"], "columns": [], "pk": []})
        t["columns"].append({k: c[k] for k in ("name", "type", "required", "default")})
        if c["pk_pos"] is not None:
            t["pk"].append((c["pk_pos"], c["name"]))
    for t in tables.values():
        t["pk"] = [name for _, name in sorted(t["pk"])]
    enums: dict[str, list[str]] = {}
    for e in query("""
        SELECT t.typname, e.enumlabel FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'creator' ORDER BY t.typname, e.enumsortorder"""):
        enums.setdefault(e["typname"], []).append(e["enumlabel"])
    return {"tables": tables, "enums": enums}


def _table(name: str, write: bool = False) -> dict:
    t = schema()["tables"].get(name)
    if t is None:
        raise NotFound(f"unknown table or view: {name}")
    if write and t["view"]:
        raise ValueError(f"{name} is a read-only view")
    return t


def _coltypes(t: dict) -> dict[str, str]:
    return {c["name"]: c["type"] for c in t["columns"]}


def _param(coltype: str, value: Any):
    """Placeholder cast to the column type, so plain strings work for enums, dates, etc."""
    if coltype in ("json", "jsonb") and value is not None:
        value = Jsonb(value)
    return sql.SQL("%s::{}").format(sql.SQL(coltype)), value


def _assignments(t: dict, data: dict, sep: str) -> tuple[sql.Composed, list]:
    types = _coltypes(t)
    parts, params = [], []
    for col, value in data.items():
        if col not in types:
            raise ValueError(f"unknown column {col!r}")
        ph, v = _param(types[col], value)
        parts.append(sql.SQL("{} = {}").format(sql.Identifier(col), ph))
        params.append(v)
    return sql.SQL(sep).join(parts), params


def _key_where(table: str, t: dict, key: dict) -> tuple[sql.Composed, list]:
    if not t["pk"] or set(key) != set(t["pk"]):
        raise ValueError(f"{table} rows are addressed by exactly {t['pk']}, got {sorted(key)}")
    return _assignments(t, key, " AND ")


# ---------------------------------------------------------------------------
# Generic CRUD
# ---------------------------------------------------------------------------
_OPS = {"eq": "=", "ne": "<>", "gt": ">", "gte": ">=", "lt": "<", "lte": "<="}


def list_rows(table: str, filters: dict | None = None, limit: int = 100, offset: int = 0,
              order_by: str | None = None, desc: bool = True) -> dict:
    """filters: {"col": v} or {"col__op": v}, op in eq|ne|gt|gte|lt|lte|like|isnull."""
    t = _table(table)
    types = _coltypes(t)
    where, params = [], []
    for k, v in (filters or {}).items():
        col, _, op = k.partition("__")
        op = op or "eq"
        if col not in types:
            raise ValueError(f"unknown column {col!r} for {table}")
        ident = sql.Identifier(col)
        if op == "isnull":
            is_null = str(v).lower() in ("1", "true", "yes")
            where.append(sql.SQL("{} IS NULL" if is_null else "{} IS NOT NULL").format(ident))
        elif op == "like":
            where.append(sql.SQL("{}::text ILIKE %s").format(ident))
            params.append(f"%{v}%")
        elif op in _OPS:
            ph, v = _param(types[col], v)
            where.append(sql.SQL("{} {} {}").format(ident, sql.SQL(_OPS[op]), ph))
            params.append(v)
        else:
            raise ValueError(f"unknown filter operator {op!r}")
    where_sql = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(where) if where else sql.SQL("")
    order_col = order_by or (t["pk"][0] if t["pk"] else t["columns"][0]["name"])
    if order_col not in types:
        raise ValueError(f"unknown column {order_col!r} for {table}")
    q = sql.SQL("SELECT * FROM {}{} ORDER BY {} {} LIMIT %s OFFSET %s").format(
        sql.Identifier(table), where_sql, sql.Identifier(order_col),
        sql.SQL("DESC NULLS LAST" if desc else "ASC NULLS LAST"))
    count_q = sql.SQL("SELECT count(*) AS n FROM {}{}").format(sql.Identifier(table), where_sql)
    with pool.connection() as conn:
        rows = conn.execute(q, [*params, min(limit, 1000), offset]).fetchall()
        total = conn.execute(count_q, params).fetchone()["n"]
    return {"rows": rows, "total": total}


def create_rows(table: str, rows: list[dict]) -> list[dict]:
    t = _table(table, write=True)
    types = _coltypes(t)
    out = []
    with pool.connection() as conn:  # one transaction for the whole list
        for row in rows:
            unknown = set(row) - set(types)
            if unknown:
                raise ValueError(f"unknown columns for {table}: {sorted(unknown)}")
            phs, params = zip(*(_param(types[c], v) for c, v in row.items())) if row else ((), ())
            q = sql.SQL("INSERT INTO {} ({}) VALUES ({}) RETURNING *").format(
                sql.Identifier(table), sql.SQL(", ").join(map(sql.Identifier, row)),
                sql.SQL(", ").join(phs)) if row else sql.SQL(
                "INSERT INTO {} DEFAULT VALUES RETURNING *").format(sql.Identifier(table))
            out.append(conn.execute(q, list(params)).fetchone())
    return out


def update_row(table: str, key: dict, data: dict) -> dict:
    t = _table(table, write=True)
    if not data:
        raise ValueError("nothing to update")
    where, wparams = _key_where(table, t, key)
    sets, sparams = _assignments(t, data, ", ")
    q = sql.SQL("UPDATE {} SET {} WHERE {} RETURNING *").format(sql.Identifier(table), sets, where)
    with pool.connection() as conn:
        row = conn.execute(q, [*sparams, *wparams]).fetchone()
    if row is None:
        raise NotFound(f"no {table} row with {key}")
    return row


def delete_row(table: str, key: dict) -> dict:
    t = _table(table, write=True)
    where, params = _key_where(table, t, key)
    q = sql.SQL("DELETE FROM {} WHERE {} RETURNING *").format(sql.Identifier(table), where)
    with pool.connection() as conn:
        row = conn.execute(q, params).fetchone()
    if row is None:
        raise NotFound(f"no {table} row with {key}")
    return row


# ---------------------------------------------------------------------------
# Sync: snapshot-style upserts, each recorded as one import batch
# ---------------------------------------------------------------------------
_MANAGED = {"content_id", "account_id", "platform", "first_seen_at", "last_seen_at", "deleted_observed_at"}


def _platform(conn, account_id: int) -> str:
    row = conn.execute("SELECT platform FROM accounts WHERE account_id = %s", [account_id]).fetchone()
    if row is None:
        raise NotFound(f"no account {account_id}")
    return row["platform"]


def _metric_lookup(conn, platform: str, scope: str) -> dict[str, int]:
    """metric_key and GUI label (lower-cased) -> metric_id."""
    out = {}
    for m in conn.execute(
            "SELECT metric_id, metric_key, label FROM metric_definitions WHERE platform = %s AND scope = %s",
            [platform, scope]):
        out[m["label"].lower()] = m["metric_id"]
        out[m["metric_key"]] = m["metric_id"]
    return out


def _new_batch(conn, account_id: int, source_kind: str, source_label: str, **extra) -> int:
    cols = {"account_id": account_id, "source_kind": source_kind, "source_label": source_label,
            **{k: v for k, v in extra.items() if v is not None}}
    q = sql.SQL("INSERT INTO import_batches ({}) VALUES ({}) RETURNING batch_id").format(
        sql.SQL(", ").join(map(sql.Identifier, cols)), sql.SQL(", ").join(sql.Placeholder() * len(cols)))
    return conn.execute(q, list(cols.values())).fetchone()["batch_id"]


def sync_content(account_id: int, items: list[dict], *, full_snapshot: bool = False,
                 period_kind: str = "lifetime", default_content_type: str | None = None,
                 source_kind: str = "gui_manual", source_label: str = "manual sync",
                 file_name: str | None = None, file_sha256: str | None = None) -> dict:
    """Upsert content_items by (platform, external_id) and record their metrics.

    Each item: content_items columns (external_id required, content_type on first
    insert) plus optional "metrics": {metric_key or GUI label: value}.
    full_snapshot=True marks this account's content missing from `items` as deleted.
    """
    t = _table("content_items")
    types = _coltypes(t)
    stats = {"content_upserted": 0, "facts_inserted": 0, "unknown_metrics": set(), "marked_deleted": 0}
    with pool.connection() as conn:
        platform = _platform(conn, account_id)
        metric_ids = _metric_lookup(conn, platform, "content")
        batch_id = _new_batch(conn, account_id, source_kind, source_label,
                              file_name=file_name, file_sha256=file_sha256)
        for item in items:
            item = dict(item)
            metrics = item.pop("metrics", None) or {}
            if not item.get("external_id"):
                raise ValueError(f"item without external_id: {item}")
            item.setdefault("content_type", default_content_type)
            if item["content_type"] is None:
                raise ValueError(f"item {item['external_id']} needs content_type")
            fields = {k: v for k, v in item.items() if k not in _MANAGED}
            unknown = set(fields) - set(types)
            if unknown:
                raise ValueError(f"unknown content_items columns: {sorted(unknown)}")
            row = {"account_id": account_id, "platform": platform, **fields}
            phs, params = zip(*(_param(types[c], v) for c, v in row.items()))
            updates = [sql.SQL("{0} = EXCLUDED.{0}").format(sql.Identifier(c)) for c in fields]
            q = sql.SQL("""INSERT INTO content_items ({}) VALUES ({})
                ON CONFLICT (platform, external_id) DO UPDATE SET {}, last_seen_at = now(),
                deleted_observed_at = NULL RETURNING content_id""").format(
                sql.SQL(", ").join(map(sql.Identifier, row)), sql.SQL(", ").join(phs),
                sql.SQL(", ").join(updates))
            content_id = conn.execute(q, list(params)).fetchone()["content_id"]
            stats["content_upserted"] += 1
            for name, value in metrics.items():
                metric_id = metric_ids.get(str(name).lower()) or metric_ids.get(name)
                if metric_id is None:
                    stats["unknown_metrics"].add(name)
                    continue
                if value is None:
                    continue
                cur = conn.execute(
                    """INSERT INTO content_metric_facts
                       (content_id, metric_id, period_kind, value, batch_id)
                       VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING""",
                    [content_id, metric_id, period_kind, value, batch_id])
                stats["facts_inserted"] += cur.rowcount
        if full_snapshot:
            stats["marked_deleted"] = conn.execute(
                """UPDATE content_items SET deleted_observed_at = now()
                   WHERE account_id = %s AND deleted_observed_at IS NULL AND last_seen_at < now()""",
                [account_id]).rowcount
        conn.execute("UPDATE import_batches SET row_count = %s WHERE batch_id = %s", [len(items), batch_id])
    return {"batch_id": batch_id, **stats, "unknown_metrics": sorted(stats["unknown_metrics"])}


def sync_account_metrics(account_id: int, rows: list[dict], *, scope: str = "account",
                         source_kind: str = "gui_manual", source_label: str = "manual sync",
                         file_name: str | None = None, file_sha256: str | None = None) -> dict:
    """Each row: {"metric": key or GUI label, "value": n, "period_start": date,
    "period_end": date (defaults to start), "period_kind": "day" (default)}."""
    inserted, unknown = 0, set()
    with pool.connection() as conn:
        platform = _platform(conn, account_id)
        metric_ids = _metric_lookup(conn, platform, scope)
        starts = [r["period_start"] for r in rows if r.get("period_start")]
        batch_id = _new_batch(conn, account_id, source_kind, source_label, file_name=file_name,
                              file_sha256=file_sha256, row_count=len(rows),
                              range_start=min(starts, default=None), range_end=max(starts, default=None))
        for r in rows:
            metric_id = metric_ids.get(str(r["metric"]).lower()) or metric_ids.get(r["metric"])
            if metric_id is None:
                unknown.add(r["metric"])
                continue
            cur = conn.execute(
                """INSERT INTO account_metric_facts
                   (account_id, metric_id, period_kind, period_start, period_end, value, batch_id)
                   VALUES (%s, %s, %s::period_kind_t, %s::date, %s::date, %s, %s) ON CONFLICT DO NOTHING""",
                [account_id, metric_id, r.get("period_kind", "day"), r["period_start"],
                 r.get("period_end") or r["period_start"], r["value"], batch_id])
            inserted += cur.rowcount
    return {"batch_id": batch_id, "facts_inserted": inserted, "unknown_metrics": sorted(unknown)}


def sync_relationships(account_id: int, relation: str, people: list[dict], *, full_snapshot: bool = True,
                       source_kind: str = "gui_manual", source_label: str = "manual sync") -> dict:
    """Upsert people + relationships. With full_snapshot, anyone previously observed
    with this relation but absent now gets ended_inferred_at (inferred unfollow)."""
    new = 0
    with pool.connection() as conn:
        platform = _platform(conn, account_id)
        batch_id = _new_batch(conn, account_id, source_kind, source_label, row_count=len(people))
        for p in people:
            if not p.get("handle"):
                raise ValueError(f"person without handle: {p}")
            person_id = conn.execute(
                """INSERT INTO people (platform, handle, display_name, external_id, headline, profile_url)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   ON CONFLICT (platform, handle) DO UPDATE SET
                     display_name = COALESCE(EXCLUDED.display_name, people.display_name),
                     external_id  = COALESCE(EXCLUDED.external_id, people.external_id),
                     headline     = COALESCE(EXCLUDED.headline, people.headline),
                     profile_url  = COALESCE(EXCLUDED.profile_url, people.profile_url)
                   RETURNING person_id""",
                [platform, p["handle"], p.get("display_name"), p.get("external_id"),
                 p.get("headline"), p.get("profile_url")]).fetchone()["person_id"]
            inserted = conn.execute(
                """INSERT INTO relationships (account_id, person_id, relation, relation_since,
                                              first_batch_id, last_batch_id)
                   VALUES (%s, %s, %s, %s::date, %s, %s)
                   ON CONFLICT (account_id, person_id, relation) DO UPDATE SET
                     last_batch_id = EXCLUDED.last_batch_id, last_observed_at = now(),
                     ended_inferred_at = NULL,
                     relation_since = COALESCE(EXCLUDED.relation_since, relationships.relation_since)
                   RETURNING (xmax = 0) AS inserted""",
                [account_id, person_id, relation, p.get("relation_since"), batch_id, batch_id]
            ).fetchone()["inserted"]
            new += inserted
        ended = 0
        if full_snapshot:
            ended = conn.execute(
                """UPDATE relationships SET ended_inferred_at = now()
                   WHERE account_id = %s AND relation = %s AND ended_inferred_at IS NULL
                     AND last_observed_at < now()""", [account_id, relation]).rowcount
    return {"batch_id": batch_id, "observed": len(people), "new": new, "ended_inferred": ended}


# ---------------------------------------------------------------------------
# CSV import (YouTube/TikTok/IG/LinkedIn GUI exports)
# ---------------------------------------------------------------------------
_CONTENT_ALIASES = {
    "external_id": ["external_id", "content", "video id", "video", "post id", "id", "media id", "post url"],
    "title": ["title", "video title", "post title", "post"],
    "published_at": ["published_at", "video publish time", "publish time", "date posted", "posted", "created"],
    "url": ["url", "link", "permalink"],
    "duration_seconds": ["duration_seconds", "duration"],
    "content_type": ["content_type", "type"],
    "caption": ["caption", "description"],
}
_DATE_ALIASES = ["period_start", "date", "day"]


def _num(v: str):
    v = (v or "").replace(",", "").replace("%", "").strip()
    try:
        return float(v)
    except ValueError:
        return None


def import_csv(account_id: int, kind: str, data: bytes, file_name: str | None = None,
               default_content_type: str | None = None, period_kind: str = "day") -> dict:
    """kind='content': one row per post, metric columns become lifetime content facts.
    kind='account_metrics': one row per date, metric columns become account facts."""
    text = data.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    headers = {h: h.strip().lower() for h in reader.fieldnames or []}
    sha = hashlib.sha256(data).hexdigest()
    common = {"source_kind": "csv_export", "source_label": f"CSV import ({kind})",
              "file_name": file_name, "file_sha256": sha}

    def pick(aliases):
        return next((h for h, low in headers.items() if low in aliases), None)

    if kind == "account_metrics":
        date_col = pick(_DATE_ALIASES)
        if date_col is None:
            raise ValueError(f"no date column (one of {_DATE_ALIASES}) in {list(headers)}")
        end_col = pick(["period_end"])
        rows = []
        for r in reader:
            if not r[date_col] or r[date_col].strip().lower() == "total":
                continue
            for h in headers:
                if h in (date_col, end_col) or (value := _num(r[h])) is None:
                    continue
                rows.append({"metric": h.strip(), "value": value, "period_kind": period_kind,
                             "period_start": r[date_col], "period_end": r[end_col] if end_col else None})
        return sync_account_metrics(account_id, rows, **common)

    if kind == "content":
        field_cols = {f: c for f, aliases in _CONTENT_ALIASES.items() if (c := pick(aliases))}
        if "external_id" not in field_cols:
            raise ValueError(f"no id column (one of {_CONTENT_ALIASES['external_id']}) in {list(headers)}")
        items = []
        for r in reader:
            ext = (r[field_cols["external_id"]] or "").strip()
            if not ext or ext.lower() == "total":
                continue
            item = {f: (r[c].strip() or None) for f, c in field_cols.items()}
            if "duration_seconds" in item:
                item["duration_seconds"] = _num(item["duration_seconds"] or "")
            item["metrics"] = {h.strip(): v for h in headers
                               if h not in field_cols.values() and (v := _num(r[h])) is not None}
            items.append(item)
        return sync_content(account_id, items, default_content_type=default_content_type, **common)

    raise ValueError("kind must be 'content' or 'account_metrics'")


# ---------------------------------------------------------------------------
# Dashboard queries
# ---------------------------------------------------------------------------
def overview() -> list[dict]:
    return query("""
        SELECT a.account_id, a.platform, a.handle, a.display_name, a.account_type,
          (SELECT v FROM (
              SELECT s.follower_count AS v, s.captured_at FROM account_profile_snapshots s
              WHERE s.account_id = a.account_id AND s.follower_count IS NOT NULL
              UNION ALL
              SELECT f.value, f.captured_at FROM account_metric_facts f
              JOIN metric_definitions m USING (metric_id)
              WHERE f.account_id = a.account_id
                AND m.metric_key IN ('total_followers', 'subscribers_realtime')
           ) x ORDER BY captured_at DESC LIMIT 1) AS followers,
          (SELECT count(*) FROM content_items c
           WHERE c.account_id = a.account_id AND c.deleted_observed_at IS NULL) AS content_count,
          (SELECT sum(views) FROM v_content_summary s WHERE s.account_id = a.account_id) AS total_views,
          (SELECT sum(COALESCE(likes, 0) + COALESCE(comments, 0) + COALESCE(shares, 0) + COALESCE(saves, 0))
           FROM v_content_summary s WHERE s.account_id = a.account_id) AS total_engagements,
          (SELECT max(imported_at) FROM import_batches b WHERE b.account_id = a.account_id) AS last_import
        FROM accounts a ORDER BY a.platform, a.handle""")


def timeseries(account_id: int, metric_key: str, start: str | None = None, end: str | None = None,
               period_kind: str = "day") -> list[dict]:
    """Latest captured value per period for one account-level metric."""
    return query("""
        SELECT DISTINCT ON (f.period_start, f.period_end)
               f.period_start, f.period_end, f.value, f.captured_at
        FROM account_metric_facts f JOIN metric_definitions m USING (metric_id)
        WHERE f.account_id = %s AND m.metric_key = %s AND f.period_kind = %s::period_kind_t
          AND (%s::date IS NULL OR f.period_start >= %s::date)
          AND (%s::date IS NULL OR f.period_end <= %s::date)
        ORDER BY f.period_start, f.period_end, f.captured_at DESC""",
                 [account_id, metric_key, period_kind, start, start, end, end])
