# Configuration

Creator Analytics is configured with environment variables. Every variable has a working default for the local setup
in the [installation guide](installation.md), so a fresh clone needs no configuration at all.

## Backend

The backend reads settings from the environment and from `backend/.env` (environment variables win). Copy the example to
start:

```bash
cp backend/.env.example backend/.env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://creator:creator@localhost:5433/creator` | PostgreSQL connection URL, in the format `psql` accepts. The backend adds the SQLAlchemy driver name itself. Used by the API, the MCP server and Alembic. |
| `CORS_ORIGIN_REGEX` | `https?://(localhost\|127\.0\.0\.1)(:\d+)?` | Regular expression of browser origins allowed to call the API. Widen it only if you serve the web app from another host. |
| `TEST_DATABASE_URL` | `postgresql://creator:creator@localhost:5433/creator_test` | Database used by `pytest`. It is created if missing. Read from the environment only, not from `backend/.env`. |

`backend/core/conf.py` also defines `DATABASE_SCHEMA` (`creator`), `FASTAPI_TITLE` and `FASTAPI_API_V1_PATH`
(`/api/v1`). Leave these at their defaults: the migrations create the `creator` schema, and the web app calls `/api/v1`.

`backend/.env` is ignored by git. Never commit it.

## Web app

Vite reads `web/.env`:

```bash
cp web/.env.example web/.env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the backend, without `/api/v1`. Baked into the bundle at build time. |

The dev server port is set in `web/vite.config.ts` (`3000`).

## Database (Docker Compose)

`docker-compose.yml` runs PostgreSQL 17 with:

| Setting | Value |
|---|---|
| User / password / database | `creator` / `creator` / `creator` |
| Published port | `127.0.0.1:5433` → container `5432` (local machine only) |
| Data volume | `pgdata` |

The password is a development default. If you change it in `docker-compose.yml`, update `DATABASE_URL` in
`backend/.env` and in your MCP client configuration to match. To remove all data: `docker compose down -v`.

## MCP server

The MCP server reads the same backend settings. MCP clients start it as a subprocess and usually do **not** pass your
shell's environment variables to it, so set `DATABASE_URL` in the client's configuration (as `.mcp.json` does) or in
`backend/.env`. See [MCP setup](mcp-setup.md).

## Deployment notes

The application is designed for a single user on their own machine and has no authentication. If you run it anywhere
else:

- Keep the API on `127.0.0.1`, or put it behind a reverse proxy that adds authentication and TLS.
- Change the database password and keep the database off public networks.
- Set `CORS_ORIGIN_REGEX` to exactly the origin that serves the web app.
- Remember that anything able to reach the API or start the MCP server can read and delete all data.

See [SECURITY.md](../../SECURITY.md).
