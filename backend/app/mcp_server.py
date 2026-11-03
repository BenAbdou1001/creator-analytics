"""MCP server: lets an AI assistant read, add, modify, sync and delete creator analytics data.

Tools call the same services as the REST API (app/creator/service), so behaviour is identical.

Run (stdio):  uv run --directory backend creator-mcp
"""

from collections.abc import AsyncIterator
from datetime import date
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from mcp.server.mcpserver import MCPServer

from app.creator.service.dashboard_service import dashboard_service
from app.creator.service.import_service import import_service
from app.creator.service.sync_service import sync_service
from app.creator.service.table_service import table_service
from database.db import async_db_session

mcp = MCPServer(
    "creator-analytics",
    instructions=(
        "Creator analytics warehouse for YouTube, TikTok, Instagram and LinkedIn (Postgres schema "
        "`creator`). Call describe_schema first to learn tables, columns, primary keys and enum values. "
        "Metrics are long/narrow facts keyed by metric_definitions (platform, scope, metric_key); "
        "prefer the sync_* tools for bringing in dashboard data because they upsert, resolve metric "
        "keys/labels and record provenance in import_batches. Views (v_*) are read-only. Platforms delete "
        "their history: call expiring_metrics to see what must be exported next."
    ),
)


@asynccontextmanager
async def transaction() -> AsyncIterator:
    """Each tool call is one transaction, like one REST request."""
    async with async_db_session.begin() as db:
        yield db


@mcp.tool()
def describe_schema() -> dict[str, Any]:
    """All tables/views with columns, types, required flags, primary keys, plus every enum's allowed values."""
    return table_service.schema()


@mcp.tool()
async def read_rows(table: str, filters: dict[str, Any] | None = None, limit: int = 50, offset: int = 0,
              order_by: str | None = None, descending: bool = True) -> dict[str, Any]:
    """Read rows from a table or view (e.g. accounts, content_items, v_content_summary,
    metric_definitions, account_metric_facts, v_inferred_unfollows).

    filters: {"column": value} for equality, or {"column__op": value} with op one of
    eq, ne, gt, gte, lt, lte, like (case-insensitive substring), isnull (true/false).
    Returns {"rows": [...], "total": matching row count}.
    """
    async with transaction() as db:
        return await table_service.list(db=db, table=table, filters=filters, limit=limit, offset=offset,
                                        order_by=order_by, desc=descending)


@mcp.tool()
async def create_rows(table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Insert one or more rows into a table in a single transaction; returns the inserted rows.
    Omit serial ids and defaulted columns. Enum/date/json values may be passed as plain strings/objects.

    content_briefs = the creative decisions behind a post (fill it from a transcript/caption). Every insert is a
    new version; the newest brief_id is the post's current brief (see v_content_performance). Only content_id is
    required, e.g. create_rows("content_briefs", [{"content_id": 1, "label": "A - question hook",
    "topic": "productivity", "content_format": "tutorial", "audience_awareness": "problem_aware",
    "hook_text": "Why do 90% of todo lists fail?", "hook_type": "question", "hook_duration_seconds": 2.5,
    "main_points": ["capture", "triage", "review"], "cta": "Follow for part 2", "cta_placement": "end",
    "voiceover": true, "audio_quality": 4, "storytelling": false}]).
    Enums: content_format, audience_awareness, cta_placement (values in describe_schema); audio_quality is 1-5.
    Free-text fields (topic, hook_type, content_pillar...) are grouped on: reuse existing spellings, lowercase."""
    async with transaction() as db:
        return await table_service.create(db=db, table=table, rows=rows)


@mcp.tool()
async def update_row(table: str, key: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    """Update one row. key must contain exactly the table's primary key columns
    (e.g. {"account_id": 3}, or {"content_id": 1, "tag_type": "hashtag", "value": "ai"})."""
    async with transaction() as db:
        return await table_service.update(db=db, table=table, key=key, data=data)


@mcp.tool()
async def delete_row(table: str, key: dict[str, Any]) -> dict[str, Any]:
    """Delete one row by its full primary key; returns the deleted row.
    Deleting an account cascades to its content, facts, batches and relationships."""
    async with transaction() as db:
        return await table_service.delete(db=db, table=table, key=key)


@mcp.tool()
async def sync_content(account_id: int, items: list[dict[str, Any]], full_snapshot: bool = False,
                 period_kind: str = "lifetime", default_content_type: str | None = None,
                 source_label: str = "AI assistant sync") -> dict[str, Any]:
    """Upsert posts/videos for an account and record a metrics snapshot for each.

    items: [{"external_id": "abc123", "content_type": "video", "title": "...",
             "published_at": "2026-10-01T12:00:00Z", "url": "...",
             "metrics": {"views": 1200, "likes": 80, "Average view duration": 95}}]
    Metric names may be metric_key or the GUI label from metric_definitions (scope=content).
    full_snapshot=True marks the account's content absent from items as deleted_observed_at.
    """
    async with transaction() as db:
        return await sync_service.sync_content(db=db, account_id=account_id, items=items, full_snapshot=full_snapshot,
                                               period_kind=period_kind, default_content_type=default_content_type,
                                               source_label=source_label)


@mcp.tool()
async def sync_account_metrics(account_id: int, rows: list[dict[str, Any]], scope: str = "account",
                         source_label: str = "AI assistant sync") -> dict[str, Any]:
    """Record account-level metric values.

    rows: [{"metric": "views", "value": 5400, "period_start": "2026-10-01",
            "period_end": "2026-10-01", "period_kind": "day"}]
    period_kind: day|week|month|year|range|lifetime|realtime|snapshot|first_24h.
    scope: account|live|audience (matches metric_definitions.scope).
    """
    async with transaction() as db:
        return await sync_service.sync_account_metrics(db=db, account_id=account_id, rows=rows, scope=scope,
                                                       source_label=source_label)


@mcp.tool()
async def sync_relationships(account_id: int, relation: str, people: list[dict[str, Any]],
                       full_snapshot: bool = True, source_label: str = "AI assistant sync") -> dict[str, Any]:
    """Sync a follower/following/subscriber/connection list.

    people: [{"handle": "jane", "display_name": "Jane", "headline": "...", "relation_since": "2026-01-02"}]
    With full_snapshot=True, people previously seen with this relation but missing now are
    flagged ended_inferred_at (see view v_inferred_unfollows).
    """
    async with transaction() as db:
        return await sync_service.sync_relationships(db=db, account_id=account_id, relation=relation, people=people,
                                                     full_snapshot=full_snapshot, source_label=source_label)


@mcp.tool()
async def import_file(account_id: int, path: str, kind: str = "content", default_content_type: str | None = None,
                period_kind: str = "day") -> dict[str, Any]:
    """Import a platform export from a local file.
    LinkedIn: the .xlsx from Analytics > Export (daily impressions/engagements, followers, posts,
    demographics) - kind is ignored. CSV files: kind='content' for one row per post (id column +
    metric columns, e.g. YouTube Content export), kind='account_metrics' for one row per date."""
    p = Path(path).expanduser()
    async with transaction() as db:
        return await import_service.import_file(db=db, account_id=account_id, kind=kind, data=p.read_bytes(),
                                                file_name=p.name, default_content_type=default_content_type,
                                                period_kind=period_kind)


@mcp.tool()
async def dashboard_overview() -> list[dict[str, Any]]:
    """Per-account headline numbers: followers, content count, total views, engagements, last import."""
    async with transaction() as db:
        return await dashboard_service.overview(db=db)


@mcp.tool()
async def metric_timeseries(account_id: int, metric_key: str, start: str | None = None, end: str | None = None,
                      period_kind: str = "day") -> list[dict[str, Any]]:
    """Time series of one account-level metric (latest capture per period). Dates are YYYY-MM-DD."""
    async with transaction() as db:
        return await dashboard_service.timeseries(
            db=db, account_id=account_id, metric_key=metric_key, start=date.fromisoformat(start) if start else None,
            end=date.fromisoformat(end) if end else None, period_kind=period_kind)


@mcp.tool()
async def expiring_metrics() -> list[dict[str, Any]]:
    """What each account has saved of the metrics its platform deletes, most urgent first.

    saved_as: 'days' (daily history, with days_left until unsaved days start being lost; 0 or less means
    they are being lost now), 'totals' (range totals only), 'nothing' (never saved). gui_path says where
    to export it."""
    async with transaction() as db:
        return await dashboard_service.expiring(db=db)


@mcp.tool()
async def sync_revenue(account_id: int, rows: list[dict[str, Any]], source_kind: str = "gui_manual",
                       source_label: str = "manual sync") -> dict[str, Any]:
    """Record earnings. Each row: {"metric": key or GUI label, "revenue_source": "ads", "value": n,
    "currency": "USD", "period_start": date, "period_end"?: date, "period_kind"?: "month",
    "is_estimated"?: true}. Metric names are the platform's scope='revenue' catalogue entries."""
    async with transaction() as db:
        return await sync_service.sync_revenue(db=db, account_id=account_id, rows=rows, source_kind=source_kind,
                                               source_label=source_label)


def main():
    mcp.run()


if __name__ == "__main__":
    main()
