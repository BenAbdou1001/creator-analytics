"""MCP server: lets an AI assistant read, add, modify, sync and delete creator analytics data.

Run (stdio):  uv run --directory backend creator-mcp
"""

from pathlib import Path
from typing import Any

from mcp.server.mcpserver import MCPServer

from . import db

mcp = MCPServer(
    "creator-analytics",
    instructions=(
        "Creator analytics warehouse for YouTube, TikTok, Instagram and LinkedIn (Postgres schema "
        "`creator`). Call describe_schema first to learn tables, columns, primary keys and enum values. "
        "Metrics are long/narrow facts keyed by metric_definitions (platform, scope, metric_key); "
        "prefer the sync_* tools for bringing in dashboard data because they upsert, resolve metric "
        "keys/labels and record provenance in import_batches. Views (v_*) are read-only."
    ),
)


@mcp.tool()
def describe_schema() -> dict[str, Any]:
    """All tables/views with columns, types, required flags, primary keys, plus every enum's allowed values."""
    return db.schema()


@mcp.tool()
def read_rows(table: str, filters: dict[str, Any] | None = None, limit: int = 50, offset: int = 0,
              order_by: str | None = None, descending: bool = True) -> dict[str, Any]:
    """Read rows from a table or view (e.g. accounts, content_items, v_content_summary,
    metric_definitions, account_metric_facts, v_inferred_unfollows).

    filters: {"column": value} for equality, or {"column__op": value} with op one of
    eq, ne, gt, gte, lt, lte, like (case-insensitive substring), isnull (true/false).
    Returns {"rows": [...], "total": matching row count}.
    """
    return db.list_rows(table, filters, limit, offset, order_by, descending)


@mcp.tool()
def create_rows(table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Insert one or more rows into a table in a single transaction; returns the inserted rows.
    Omit serial ids and defaulted columns. Enum/date/json values may be passed as plain strings/objects."""
    return db.create_rows(table, rows)


@mcp.tool()
def update_row(table: str, key: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    """Update one row. key must contain exactly the table's primary key columns
    (e.g. {"account_id": 3}, or {"content_id": 1, "tag_type": "hashtag", "value": "ai"})."""
    return db.update_row(table, key, data)


@mcp.tool()
def delete_row(table: str, key: dict[str, Any]) -> dict[str, Any]:
    """Delete one row by its full primary key; returns the deleted row.
    Deleting an account cascades to its content, facts, batches and relationships."""
    return db.delete_row(table, key)


@mcp.tool()
def sync_content(account_id: int, items: list[dict[str, Any]], full_snapshot: bool = False,
                 period_kind: str = "lifetime", default_content_type: str | None = None,
                 source_label: str = "AI assistant sync") -> dict[str, Any]:
    """Upsert posts/videos for an account and record a metrics snapshot for each.

    items: [{"external_id": "abc123", "content_type": "video", "title": "...",
             "published_at": "2026-10-01T12:00:00Z", "url": "...",
             "metrics": {"views": 1200, "likes": 80, "Average view duration": 95}}]
    Metric names may be metric_key or the GUI label from metric_definitions (scope=content).
    full_snapshot=True marks the account's content absent from items as deleted_observed_at.
    """
    return db.sync_content(account_id, items, full_snapshot=full_snapshot, period_kind=period_kind,
                           default_content_type=default_content_type, source_label=source_label)


@mcp.tool()
def sync_account_metrics(account_id: int, rows: list[dict[str, Any]], scope: str = "account",
                         source_label: str = "AI assistant sync") -> dict[str, Any]:
    """Record account-level metric values.

    rows: [{"metric": "views", "value": 5400, "period_start": "2026-10-01",
            "period_end": "2026-10-01", "period_kind": "day"}]
    period_kind: day|week|month|year|range|lifetime|realtime|snapshot|first_24h.
    scope: account|live|audience (matches metric_definitions.scope).
    """
    return db.sync_account_metrics(account_id, rows, scope=scope, source_label=source_label)


@mcp.tool()
def sync_relationships(account_id: int, relation: str, people: list[dict[str, Any]],
                       full_snapshot: bool = True, source_label: str = "AI assistant sync") -> dict[str, Any]:
    """Sync a follower/following/subscriber/connection list.

    people: [{"handle": "jane", "display_name": "Jane", "headline": "...", "relation_since": "2026-01-02"}]
    With full_snapshot=True, people previously seen with this relation but missing now are
    flagged ended_inferred_at (see view v_inferred_unfollows).
    """
    return db.sync_relationships(account_id, relation, people, full_snapshot=full_snapshot,
                                 source_label=source_label)


@mcp.tool()
def import_csv_file(account_id: int, path: str, kind: str, default_content_type: str | None = None,
                    period_kind: str = "day") -> dict[str, Any]:
    """Import a platform CSV export from a local file.
    kind='content': one row per post (id column + metric columns, e.g. YouTube Content export).
    kind='account_metrics': one row per date + metric columns (e.g. YouTube 'Export current view' chart data)."""
    p = Path(path).expanduser()
    return db.import_csv(account_id, kind, p.read_bytes(), p.name, default_content_type, period_kind)


@mcp.tool()
def dashboard_overview() -> list[dict[str, Any]]:
    """Per-account headline numbers: followers, content count, total views, engagements, last import."""
    return db.overview()


@mcp.tool()
def metric_timeseries(account_id: int, metric_key: str, start: str | None = None, end: str | None = None,
                      period_kind: str = "day") -> list[dict[str, Any]]:
    """Time series of one account-level metric (latest capture per period). Dates are YYYY-MM-DD."""
    return db.timeseries(account_id, metric_key, start, end, period_kind)


def main():
    mcp.run()


if __name__ == "__main__":
    main()
