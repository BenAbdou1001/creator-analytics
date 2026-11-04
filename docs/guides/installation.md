# Installation

This guide sets up Creator Analytics on your own machine for everyday use or development.

## Prerequisites

| Tool | Version | Used for |
|---|---|---|
| [Docker](https://docs.docker.com/get-docker/) with Compose | any recent | Runs PostgreSQL 17 |
| [uv](https://docs.astral.sh/uv/) | any recent | Python dependencies and commands for the backend |
| Python | 3.12 or newer | Backend. `uv` installs it if it is missing. |
| [Node.js](https://nodejs.org/) | 22.18 or newer | Web app (npm comes with Node) |

You can use an existing PostgreSQL server instead of Docker; see [Use your own PostgreSQL](#use-your-own-postgresql).

## 1. Clone the repository

```bash
git clone https://github.com/BenAbdou1001/creator-analytics.git
cd creator-analytics
```

## 2. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 17 on `127.0.0.1:5433` with user, password and database all set to `creator`. Data is kept in the
`pgdata` Docker volume. Compose runs only the database; the backend and web app run directly on your machine.

## 3. Install the backend and create the schema

```bash
cd backend
uv sync
uv run alembic upgrade head
```

`uv sync` creates `backend/.venv` from `uv.lock`. `alembic upgrade head` creates the `creator` schema, its tables and
views, and seeds the metric catalogue (`metric_definitions`). Run it again after pulling changes that add migrations.

If your database is not at the default address, set `DATABASE_URL` first (see [Configuration](configuration.md)).

## 4. Start the API

```bash
uv run fastapi dev main.py --port 8000
```

- API: <http://localhost:8000/api/v1>
- Interactive API docs: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/api/v1/health>

`fastapi dev` reloads on code changes and binds to `127.0.0.1`. The API has no authentication, so keep it local; see
[SECURITY.md](../../SECURITY.md).

## 5. Start the web app

In a second terminal, from the repository root:

```bash
cd web
npm install
npm run dev
```

Open <http://localhost:3000>. If port 3000 is taken, Vite picks the next free port and prints it.

The web app expects the API at `http://localhost:8000`. To use another address, set `VITE_API_URL` in `web/.env`.

## 6. Add your first account and data

1. Open **Accounts** and add your account (platform, account type, handle).
2. Export analytics from the platform and drop the file on the **Import** page. See [Importing data](importing-data.md).
3. Optionally connect an AI client to the MCP server: see [MCP setup](mcp-setup.md).

## Demo data

To look around without your own data, fill a separate `creator_demo` database with four invented accounts:

```bash
docker compose exec db psql -U creator -d postgres -c 'create database creator_demo'
cd backend
export DATABASE_URL=postgresql://creator:creator@localhost:5433/creator_demo
uv run alembic upgrade head && uv run python -m scripts.seed_demo
uv run fastapi dev main.py --port 8000
```

The seed script refuses to run on any database not named `creator_demo`. Start the API with the same `DATABASE_URL` to
browse the demo data; unset it to go back to your own data.

## Running the tests

```bash
cd backend && uv run pytest                     # needs the database from docker compose
cd web && npm run typecheck && npm test && npm run build
```

Backend tests create and use their own `creator_test` database on the same server, and never touch your data.

## Production-style web build

```bash
cd web
npm run build      # output in web/dist
npm run start      # serves the build with vite preview on http://localhost:4173
```

The backend can run without auto-reload with `uv run fastapi run main.py --host 127.0.0.1 --port 8000`. There is no
Dockerfile for the backend or web app yet.

## Use your own PostgreSQL

Any PostgreSQL server the migrations can run on works. Create a database and a user that can create schemas in it, then
point the backend at it:

```bash
cd backend
export DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
uv run alembic upgrade head
```

Put the same value in `backend/.env` so you do not have to export it in every terminal, and in your MCP client
configuration (see [MCP setup](mcp-setup.md)). The project is developed and tested on PostgreSQL 17.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `connection refused` on port 5433 | The database is not running: `docker compose up -d`, then `docker compose ps`. |
| `relation "..." does not exist` | The schema is missing or out of date: `cd backend && uv run alembic upgrade head`. |
| The web app loads but shows network errors | The API is not running, or `VITE_API_URL` points to the wrong address. |
| CORS errors in the browser console | The web app is served from an origin other than `localhost` / `127.0.0.1`. Adjust `CORS_ORIGIN_REGEX`. |
| `npm test` fails with a syntax error on `.ts` imports | Node is older than 22.18. Upgrade Node. |
