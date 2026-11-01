# Creator Analytics

One place for your YouTube, TikTok, Instagram and LinkedIn numbers.

- `db/` – Postgres schema (your data model, unchanged) + migrations
- `backend/` – FastAPI REST API **and** the MCP server, layered like [fastapi-best-architecture](https://github.com/fastapi-practices/fastapi-best-architecture)
- `web/` – TanStack Start + TanStack Query + shadcn/ui dashboard, feature-based

## Project layout

```
backend/
  main.py                    app = register_app()
  core/                      conf.py (settings from env/.env), registrar.py (middleware, routers, exception handlers)
  database/db.py             psycopg pool + db_transaction()
  common/exception/          errors.py (NotFoundError, RequestError…), exception_handler.py
  common/response/           {"code", "msg", "data"} envelope: response_base.success(data=…)
  app/router.py              mounts every app module
  app/mcp_server.py          MCP tools; they call the same services as the REST API
  app/creator/
    api/v1/                  meta, tables, sync, imports, dashboard endpoints (thin)
    schema/                  pydantic request models
    service/                 business logic + transactions (sync, import, LinkedIn .xlsx, dashboard, generic tables)
    crud/                    SQL, one DAO per table/aggregate; crud_catalog drives generic CRUD from pg_catalog
    utils/  tests/

web/src/
  routes/                    thin: search validation + loader + the feature's page component
  features/<name>/           dashboard, accounts, content, imports, metrics, explorer
    api/                     keys.ts, service.ts, queries.ts (queryOptions), mutations.ts (hooks)
    components/              feature UI, exported through components/index.ts
    types/                   feature types (+ search-param validators)
    index.ts                 the feature's public API: import features only through it
  shared/
    components/ui/           shadcn/ui (add more with `npx shadcn@latest add <name>`)
    components/common/       AppSidebar, DataTable, Pager, PageHeader, Field, Options…
    lib/                     api-client.ts (the one fetch wrapper), tables.ts (generic table queries), format, nav, utils (cn)
    styles/globals.css       shadcn tokens + platform colours, light/dark
```

## Run it

```bash
docker compose up -d                                  # Postgres 17 on :5433, schema + seed metrics applied on first start
cd backend && uv sync && uv run fastapi dev main.py --port 8000   # API docs: http://localhost:8000/docs
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
| Import | Upload a platform CSV export or LinkedIn analytics .xlsx; history of import batches |
| Metric catalogue | Every dashboard metric, where to find it, and how long the platform keeps it |
| Data explorer | Browse, create, edit and delete rows in any table; read any view |

### CSV import

- **One row per post** (e.g. YouTube Studio › Content › Export): needs an id column (`Content`, `Video ID`, `Post ID`, `external_id`…). `Video title`, `Video publish time`, `Duration`, `url`, `type` are picked up as fields.
- **One row per date** (e.g. Analytics › Advanced mode › Export current view): needs a `Date` column.

Any other column is matched to `metric_definitions` by `metric_key` or by its GUI `label` (case-insensitive), so `Views` and `Watch time (hours)` just work. Unmatched columns are reported back, `Total` rows are skipped, and every import is recorded in `import_batches` with the file's SHA-256.

## MCP server

Tools: `describe_schema`, `read_rows`, `create_rows`, `update_row`, `delete_row`, `sync_content`, `sync_account_metrics`, `sync_relationships`, `import_file`, `dashboard_overview`, `metric_timeseries`.

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

Everything lives under `/api/v1` and returns `{"code": 200, "msg": "Success", "data": …}`; errors use the same shape with the HTTP status as `code`.

`GET /health` · `GET /schema` · `GET|POST|PATCH|DELETE /tables/{table}` (filters: `?col=v`, `?col__gte=v`, `__like`, `__isnull`…; PATCH/DELETE take the primary key as query params) · `POST /sync/{content,account-metrics,relationships}` · `POST /imports` (CSV, or LinkedIn analytics .xlsx) · `GET /dashboard/{overview,timeseries}`

## Change to the data model

`db/02-deferrable-batch-fks.sql` makes the foreign keys to `import_batches` `DEFERRABLE INITIALLY DEFERRED`. Without it, deleting an account that has imported data fails: Postgres checks the batch FK before the nested cascade (account → content → facts) has removed the facts. A batch that still has facts still can't be deleted on its own.
