<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo/horizontal-reversed.svg">
  <img src="assets/logo/horizontal.svg" alt="Creator Analytics" width="360">
</picture>

### Your social media analytics, kept in your own database before the platforms delete them.

[![CI](https://github.com/BenAbdou1001/creator-analytics/actions/workflows/ci.yml/badge.svg)](https://github.com/BenAbdou1001/creator-analytics/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-6556FB.svg)](LICENSE)
![Python 3.12+](https://img.shields.io/badge/Python-3.12%2B-3776AB?logo=python&logoColor=white)
![Node 22.18+](https://img.shields.io/badge/Node-22.18%2B-5FA04E?logo=nodedotjs&logoColor=white)
[![MCP server](https://img.shields.io/badge/MCP-server-6556FB)](docs/guides/mcp-setup.md)

[Documentation](#documentation) · [MCP setup](docs/guides/mcp-setup.md) · [Report a bug](https://github.com/BenAbdou1001/creator-analytics/issues/new?template=bug_report.yml) · [Request a feature](https://github.com/BenAbdou1001/creator-analytics/issues/new?template=feature_request.yml)

</div>

Creator Analytics is a self-hosted archive for creators' YouTube, TikTok, Instagram and LinkedIn analytics. It imports
the platforms' own CSV and XLSX exports into PostgreSQL, tells you which history each platform is about to delete, and
records where every number came from. A built-in [MCP](https://modelcontextprotocol.io) server lets AI clients such as
Claude and Codex read and update the same data, through the same business logic as the web app.

> [!WARNING]
> **No authentication.** Creator Analytics is a single-user app meant to run on your own machine. Anyone who can reach
> the API can read and delete everything. See [SECURITY.md](SECURITY.md).

## UI preview

Screenshots of the web app running on the invented demo data from `backend/scripts/seed_demo.py`.

<table>
  <tr>
    <td width="50%"><img src="assets/screenshots/dashboard.png" alt="Dashboard"><br><b>Dashboard</b>: totals, metrics about to expire, performance chart with post markers</td>
    <td width="50%"><img src="assets/screenshots/posts.png" alt="Posts"><br><b>Posts</b>: every post across platforms, and what worked per brief field</td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/post-detail.png" alt="Post detail"><br><b>Post</b>: numbers against your typical post, caption, versioned brief</td>
    <td><img src="assets/screenshots/post-edit.png" alt="Post editor"><br><b>Post editor</b>: post fields and the content brief, section by section</td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/import-preview.png" alt="Import preview"><br><b>Import</b>: exact dry run of an export before anything is saved</td>
    <td><img src="assets/screenshots/metrics.png" alt="Metrics catalogue"><br><b>Metrics</b>: how long each platform keeps a metric and where to export it</td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/calendar.png" alt="Calendar"><br><b>Calendar</b>: published and planned posts on every platform</td>
    <td><img src="assets/screenshots/earnings.png" alt="Earnings"><br><b>Earnings</b>: revenue by source and period, one list per currency</td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/accounts.png" alt="Accounts"><br><b>Accounts</b>: add, edit and delete social accounts</td>
    <td><img src="assets/screenshots/data.png" alt="Data explorer"><br><b>Data</b>: browse and edit any table, read any view</td>
  </tr>
</table>

## Why

Creators' numbers are spread across four dashboards that each measure things differently, and every platform deletes
history on its own schedule: some daily metrics are only available for a limited window, after which the detail is gone
for good. Exports exist, but a folder of CSV files is hard to compare, query or trust later.

Creator Analytics keeps that history in a PostgreSQL database you own. You export from the platforms, drop the files in,
and the app stores every value as a dated fact, linked to the export it came from. Nothing is scraped and nothing leaves
your machine. Because the data is yours and in a standard database, you can query it, back it up, or hand it to an AI
agent without depending on any platform staying the same.

## Features

**Centralized analytics**
- YouTube, TikTok, Instagram and LinkedIn accounts in one dashboard: followers, views and impressions, engagement, posts.
- Performance chart per account and metric, with markers for published posts.
- Audience breakdowns and inferred unfollows from follower-list snapshots.
- Earnings by source and period, with currencies kept separate.

**History preservation**
- A catalogue of every platform metric with how long the platform keeps it and where to export it.
- An "Expiring soon" view of what each account has saved and how many days are left.
- Provenance on every value: which import or sync saved it, from which file (with its SHA-256).

**Imports**
- Platform CSV exports (one row per post or one row per date) and the LinkedIn analytics `.xlsx`.
- Columns matched to metrics by key or by the label the platform uses.
- Exact dry-run preview, and a warning when the same file was already imported.

**Content management**
- Posts across platforms, searchable and sortable, with a full-screen editor.
- Versioned content briefs: topic, format, hook, script, editing and copy behind each post.
- "What worked": average views or engagement rate per brief field.
- Experiments: plan a post with a hypothesis, then compare it with your typical post and record a verdict.
- Content calendar of published and planned posts.
- A generic data explorer to create, edit and delete rows in any table.

**AI integration**
- An MCP server with 14 tools and one prompt, sharing the service layer with the REST API.
- Agent-drafted content briefs, flagged for your review in the app.

## AI and MCP integration

The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that lets AI clients call tools
provided by other programs. Creator Analytics ships an MCP server (`creator-mcp`) so an agent can work with your
analytics directly instead of you copying numbers into a chat.

The server runs locally over stdio: your AI client starts it as a subprocess, and it connects to your database. Every
tool call is one transaction that goes through the same services as the REST API, so an agent gets the same validation,
upsert rules and provenance records as the web app.

### Supported clients

| Client | How it connects |
|---|---|
| Claude Code | `.mcp.json` in this repository registers the server automatically |
| Claude Desktop | Entry in `claude_desktop_config.json` |
| OpenAI Codex CLI | `codex mcp add` or `~/.codex/config.toml` |

Configuration for each is in the [MCP setup guide](docs/guides/mcp-setup.md). Other stdio MCP clients should work but
have not been tested.

### Available tools

| Tool | Purpose |
|---|---|
| `describe_schema` | Tables, views, columns, primary keys and enum values |
| `read_rows` | Read any table or view with filters, sorting and paging |
| `create_rows` | Insert rows into a table in one transaction |
| `update_row` | Update one row by primary key |
| `delete_row` | Delete one row by primary key (accounts cascade) |
| `sync_content` | Upsert posts with a metrics snapshot; optionally mark missing posts deleted |
| `sync_account_metrics` | Record daily or ranged account metrics |
| `sync_revenue` | Record earnings per source, period and currency |
| `sync_relationships` | Sync a follower or connection list and infer who left |
| `import_file` | Import a platform CSV or LinkedIn `.xlsx` from a local path |
| `dashboard_overview` | Headline numbers per account |
| `metric_timeseries` | One account metric over time |
| `expiring_metrics` | Saved history versus what each platform deletes, most urgent first |
| `posts_needing_briefs` | Posts without a content brief, plus the vocabulary in use |

The `draft_briefs` prompt guides an agent through drafting briefs for every post that has none. Parameters and details
are in the [MCP setup guide](docs/guides/mcp-setup.md#tools).

### Example requests

- "Compare my average views per post on YouTube and TikTok over the last three months."
- "Which posts had the highest engagement rate this year, and what hook did they use?"
- "Show my daily LinkedIn impressions for October."
- "What do I need to export this week before the platforms delete it?"
- "Import `~/Downloads/Content 2026-11-01.csv` into my YouTube account."
- "Draft briefs for my new posts." (`/mcp__creator-analytics__draft_briefs` in Claude Code)

## Architecture

```mermaid
flowchart LR
    browser[Web browser] --> web["Web app<br/>TanStack Start"]
    web -- "REST /api/v1" --> api["REST API<br/>FastAPI"]
    agent["AI client<br/>Claude · Codex"] -- "MCP over stdio" --> mcp["MCP server<br/>creator-mcp"]
    exports[/"Platform exports<br/>CSV · .xlsx"/] --> api
    exports --> mcp
    api --> svc["Service layer<br/>imports · syncs · dashboard · tables"]
    mcp --> svc
    svc --> db[("PostgreSQL 17")]
```

The web app talks only to the REST API. The REST API and the MCP server are two thin entry points in the same Python
package and call the same service layer, which owns all business logic and writes to PostgreSQL. There are no background
jobs and no connections to the platforms. Details: [system overview](docs/architecture/system-overview.md).

## Tech stack

| Area | Technologies |
|---|---|
| Frontend | React 19, TanStack Start, TanStack Router, TanStack Query, Tailwind CSS 4, shadcn/ui (Radix UI), Vite, TypeScript |
| Backend | Python 3.12+, FastAPI, Pydantic Settings, SQLAlchemy 2 (async), psycopg 3, openpyxl |
| Database | PostgreSQL 17, Alembic migrations |
| AI / MCP | [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) (stdio transport) |
| Tooling | uv, npm, Docker Compose, pytest, GitHub Actions |

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with Compose (for PostgreSQL)
- [uv](https://docs.astral.sh/uv/) (installs Python 3.12+ if needed)
- [Node.js](https://nodejs.org/) 22.18 or newer

### Installation

```bash
git clone https://github.com/BenAbdou1001/creator-analytics.git
cd creator-analytics
cd backend && uv sync && cd ..
cd web && npm install && cd ..
```

### Environment variables

Every variable has a default that works with the setup below, so this step is optional.

| Variable | Where | Default |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | `postgresql://creator:creator@localhost:5433/creator` |
| `CORS_ORIGIN_REGEX` | `backend/.env` | `localhost` and `127.0.0.1` on any port |
| `VITE_API_URL` | `web/.env` | `http://localhost:8000` |

Copy `backend/.env.example` and `web/.env.example` to start. See the [configuration guide](docs/guides/configuration.md).

### Database setup

```bash
docker compose up -d                           # PostgreSQL 17 on 127.0.0.1:5433
cd backend && uv run alembic upgrade head      # schema, views and the metric catalogue
```

### Running locally

```bash
cd backend && uv run fastapi dev main.py --port 8000   # API, docs at http://localhost:8000/docs
```

In a second terminal:

```bash
cd web && npm run dev                                  # http://localhost:3000
```

To try the app with invented data first, see [demo data](docs/guides/installation.md#demo-data).

### Docker

`docker-compose.yml` runs PostgreSQL only. The backend and web app run on your machine with `uv` and `npm`; there are
no container images for them yet.

### Tests

```bash
cd backend && uv run pytest                             # uses its own creator_test database
cd web && npm run typecheck && npm test && npm run build
```

## Documentation

| Guide | Contents |
|---|---|
| [System overview](docs/architecture/system-overview.md) | Components, data model, REST API and data flows |
| [Installation](docs/guides/installation.md) | Step-by-step setup, demo data, troubleshooting |
| [Configuration](docs/guides/configuration.md) | Environment variables and deployment notes |
| [Importing data](docs/guides/importing-data.md) | Supported exports, column matching, syncs, briefs and experiments |
| [MCP setup](docs/guides/mcp-setup.md) | Connecting Claude Code, Claude Desktop and Codex; tool reference |
| [Contributing](CONTRIBUTING.md) | Development setup, checks and conventions |

## Roadmap

**Done**
- Multi-platform dashboard, metric catalogue with retention limits, and expiry tracking
- CSV and LinkedIn `.xlsx` imports with dry-run preview and provenance
- REST API and MCP server on a shared service layer
- Content briefs, agent-drafted briefs, experiments, "What worked" and the content calendar

**Planned**
- Nothing is committed yet. Ideas and requests are tracked in [issues](https://github.com/BenAbdou1001/creator-analytics/issues).

**Known limitations**
- No authentication; single user, local use only.
- No container images for the backend and web app.
- The MCP server supports the stdio transport only.

## Contributing

Bug reports, feature requests, documentation improvements and code are welcome. Read
[CONTRIBUTING.md](CONTRIBUTING.md) for the development setup and conventions, and follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Security

The app has no authentication by design and must stay on your own machine. To report a vulnerability, use private
reporting as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 Benassloun Abdallah.

The bundled fonts, Plus Jakarta Sans and Noto Sans Arabic, are under the SIL Open Font License. Platform names and marks
belong to their owners; this project is not affiliated with YouTube, TikTok, Instagram or LinkedIn.

## Acknowledgements

Built on [FastAPI](https://fastapi.tiangolo.com), [TanStack](https://tanstack.com), [shadcn/ui](https://ui.shadcn.com),
[SQLAlchemy](https://www.sqlalchemy.org), [Alembic](https://alembic.sqlalchemy.org), the
[MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk) and [uv](https://docs.astral.sh/uv/). The backend
layout follows [fastapi-best-architecture](https://github.com/fastapi-practices/fastapi-best-architecture).
