# Creator Analytics

One place for your YouTube, TikTok, Instagram and LinkedIn numbers.

- `db/` – Postgres schema (your data model, unchanged) + one migration
- `backend/` – FastAPI REST API **and** the MCP server (same data layer, `app/db.py`)
- `web/` – TanStack Start + TanStack Query dashboard

## Run it

```bash
docker compose up -d                                  # Postgres 17 on :5433, schema + seed metrics applied on first start
cd backend && uv sync && uv run fastapi dev app/main.py --port 8000   # API docs: http://localhost:8000/docs
cd web && npm install && npm run dev                  # http://localhost:3000 (Vite picks the next free port if taken)
```

Env: `DATABASE_URL` (backend, default `postgresql://creator:creator@localhost:5433/creator`),
`VITE_API_URL` (web, default `http://localhost:8000`).

Test (needs the database running): `cd backend && uv run pytest`

## Web app

| Page | What it does |
|---|---|
| Dashboard | Totals, per-account cards, daily trend chart for any account metric, top content |
| Content | All posts/videos across platforms, filter/sort/search, click a row for its latest metrics |
| Accounts | Add / edit / delete your accounts |
| Import | Upload a platform CSV export; history of import batches |
| Metric catalogue | Every dashboard metric, where to find it, and how long the platform keeps it |
| Data explorer | Browse, create, edit and delete rows in any table; read any view |

### CSV import

- **One row per post** (e.g. YouTube Studio › Content › Export): needs an id column (`Content`, `Video ID`, `Post ID`, `external_id`…). `Video title`, `Video publish time`, `Duration`, `url`, `type` are picked up as fields.
- **One row per date** (e.g. Analytics › Advanced mode › Export current view): needs a `Date` column.

Any other column is matched to `metric_definitions` by `metric_key` or by its GUI `label` (case-insensitive), so `Views` and `Watch time (hours)` just work. Unmatched columns are reported back, `Total` rows are skipped, and every import is recorded in `import_batches` with the file's SHA-256.

## MCP server

Tools: `describe_schema`, `read_rows`, `create_rows`, `update_row`, `delete_row`, `sync_content`, `sync_account_metrics`, `sync_relationships`, `import_csv_file`, `dashboard_overview`, `metric_timeseries`.

- **Claude Code**: `.mcp.json` in this folder registers it automatically. Start Claude Code here and approve the server.
- **Claude Desktop**: add to `claude_desktop_config.json`:
  ```json
  { "mcpServers": { "creator-analytics": {
      "command": "uv",
      "args": ["run", "--directory", "/ABSOLUTE/PATH/creator-analytics/backend", "creator-mcp"] } } }
  ```

"Sync" means snapshot sync, which matches how the data model works:
- `sync_content` upserts posts by `(platform, external_id)` and stores a metric snapshot. With `full_snapshot`, posts missing from the list get `deleted_observed_at`.
- `sync_relationships` upserts a follower/connection list. With `full_snapshot`, anyone who disappeared gets `ended_inferred_at` (see `v_inferred_unfollows`).
- `sync_account_metrics` stores daily or ranged account metrics.

Each call creates one `import_batches` row.

## REST API

`GET /api/schema` · `GET|POST|PATCH|DELETE /api/tables/{table}` (filters: `?col=v`, `?col__gte=v`, `__like`, `__isnull`…; PATCH/DELETE take the primary key as query params) · `POST /api/sync/{content,account-metrics,relationships}` · `POST /api/import/csv` · `GET /api/dashboard/{overview,timeseries}`

## Change to the data model

`db/02-deferrable-batch-fks.sql` makes the foreign keys to `import_batches` `DEFERRABLE INITIALLY DEFERRED`. Without it, deleting an account that has imported data fails: Postgres checks the batch FK before the nested cascade (account → content → facts) has removed the facts. A batch that still has facts still can't be deleted on its own.
