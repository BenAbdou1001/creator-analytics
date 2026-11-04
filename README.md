<img src="docs/brand/logo/master/horizontal.svg" alt="Creator Analytics" width="320">

[![CI](https://github.com/BenAbdou1001/creator-analytics/actions/workflows/ci.yml/badge.svg)](https://github.com/BenAbdou1001/creator-analytics/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-6556FB.svg)](LICENSE)

One place for your YouTube, TikTok, Instagram and LinkedIn numbers, including what each platform is about to delete and
where every value came from.

Self-hosted and single-user. Data comes in from the platforms' own CSV and XLSX exports, or from an AI agent through the
MCP server. Nothing is scraped and nothing leaves your machine.

> **No authentication.** Anyone who can reach the API can read and delete everything. Run it on your own machine, or
> behind a proxy that adds auth. See [SECURITY.md](SECURITY.md).

- `docs/brand/GUIDE.md` – UI style guide
- `docs/brand/logo/` – logo files and usage
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
  alembic/                   schema, views and the seeded metric catalogue
  scripts/seed_demo.py       invented multi-platform data, for a separate creator_demo database
  app/creator/
    api/v1/                  meta, tables, sync, imports, dashboard endpoints (thin)
    schema/                  pydantic request models
    service/                 business logic + transactions (sync, import, LinkedIn .xlsx, dashboard, generic tables)
    crud/                    SQL, one DAO per table/aggregate; crud_catalog drives generic CRUD from pg_catalog
    utils/  tests/

web/src/
  routes/                    thin: search validation + loader + the feature's page component
  features/<name>/           dashboard, accounts, content, imports, metrics, explorer, audience, earnings
    api/                     keys.ts, service.ts, queries.ts (queryOptions), mutations.ts (hooks)
    components/              feature UI, exported through components/index.ts
    types/                   feature types (+ search-param validators)
    index.ts                 the feature's public API: import features only through it
  shared/
    components/ui/           shadcn/ui (add more with `npx shadcn@latest add <name>`)
    components/common/       Rail, BrandMark, DataTable, Sounding, PlatformBadge, Provenance, ConfirmDialog, EmptyState…
    lib/                     api-client.ts (the one fetch wrapper), tables.ts (generic table queries), format, nav, utils (cn)
    styles/globals.css       shadcn tokens + platform colours, light/dark
```

## Run it

Needs Docker, [uv](https://docs.astral.sh/uv/) and Node 22 or newer.

```bash
git clone https://github.com/BenAbdou1001/creator-analytics.git && cd creator-analytics
docker compose up -d                                  # Postgres 17 on :5433
cd backend && uv sync && uv run alembic upgrade head  # schema, views and the metric catalogue
uv run fastapi dev main.py --port 8000                # API docs: http://localhost:8000/docs
```

In a second terminal, from the repo root:

```bash
cd web && npm install && npm run dev                  # http://localhost:3000 (Vite picks the next free port if taken)
```

Env: `DATABASE_URL` (backend, default `postgresql://creator:creator@localhost:5433/creator`),
`VITE_API_URL` (web, default `http://localhost:8000`).

Test (needs the database running): `cd backend && uv run pytest`. Tests use their own `creator_test` database and never
touch real data.

Demo data for judging the UI across all four platforms: see `backend/scripts/seed_demo.py`.

## Web app

| Page | What it does |
|---|---|
| Dashboard | Totals, what expires soonest, performance chart with post markers, accounts, top posts |
| Posts | Every post across platforms, sortable and searchable; a post opens in a linkable side sheet with its provenance and its brief. "What worked" averages views / engagement rate per brief field |
| Audience | Latest demographic breakdowns and people who left |
| Earnings | Revenue by source and period, one list per currency |
| Import | Drop an export, see an exact dry run, then import; daily history held and import history |
| Metrics | Every platform metric, how long the platform keeps it, where to export it |
| Accounts | Add, edit and delete accounts |
| Data | Browse, create, edit and delete rows in any table; read any view |

### Post briefs

`content_briefs` holds the creative decisions behind a post (topic, format, hook, script, editing, written copy), written by hand or by an agent via MCP `create_rows`, never by sync or import. A post can have several briefs, one per version. The newest `brief_id` is the current brief, and `active_from` records when each version went live. `v_content_performance` gives one row per post: its numbers, its current brief, `caption_length`, `engagement_rate` (per view, or per impression when a platform has no views), `brief_count`, and `followers_3d`: followers gained on the publish day and the 2 days after, from the account's daily follower metric, split equally between posts published within 2 days of each other (NULL when those days aren't saved). The breakdown counts only single-version posts by default, because a post's lifetime numbers mix all of its versions.

### Experiments

Plan a post before publishing it (Posts › Plan a post): a draft post with its brief and a **hypothesis**. After the post goes live and your next export is imported, link the plan to the real post; the brief moves onto it. From a week after publishing, the post page compares it with your typical (median) post and asks for a verdict: confirmed, not confirmed or unclear. The Posts page tracks what's planned, ready to review and still settling, and "What worked" lists field combinations you've never tried.

### CSV import

- **One row per post** (e.g. YouTube Studio › Content › Export): needs an id column (`Content`, `Video ID`, `Post ID`, `external_id`…). `Video title`, `Video publish time`, `Duration`, `url`, `type` are picked up as fields.
- **One row per date** (e.g. Analytics › Advanced mode › Export current view): needs a `Date` column.

Any other column is matched to `metric_definitions` by `metric_key` or by its GUI `label` (case-insensitive), so `Views` and `Watch time (hours)` just work. Unmatched columns are reported back, `Total` rows are skipped, and every import is recorded in `import_batches` with the file's SHA-256.

## MCP server

Tools: `describe_schema`, `read_rows`, `create_rows`, `update_row`, `delete_row`, `sync_content`, `sync_account_metrics`, `sync_relationships`, `sync_revenue`, `import_file`, `dashboard_overview`, `metric_timeseries`, `expiring_metrics`.

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

## Deferred batch foreign keys

The foreign keys to `import_batches` are `DEFERRABLE INITIALLY DEFERRED` (see the initial Alembic migration). Without that, deleting an account that has imported data fails: Postgres checks the batch FK before the nested cascade (account → content → facts) has removed the facts. A batch that still has facts still can't be deleted on its own.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). The bundled fonts, Plus Jakarta Sans and Noto Sans Arabic, are under the SIL Open Font License. Platform
names and marks belong to their owners; this project is not affiliated with YouTube, TikTok, Instagram or LinkedIn.
