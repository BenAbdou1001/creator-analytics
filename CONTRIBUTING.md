# Contributing

Thanks for your interest in Creator Analytics. Bug reports, feature ideas, documentation fixes and code are all welcome.
Small, focused pull requests are the easiest to review.

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** with the [bug report form](https://github.com/BenAbdou1001/creator-analytics/issues/new?template=bug_report.yml).
- **Suggest a feature** with the [feature request form](https://github.com/BenAbdou1001/creator-analytics/issues/new?template=feature_request.yml).
- **Improve the docs**: the README and everything under [`docs/`](docs/).
- **Send code**: for anything larger than a small fix, open an issue first so we can agree on the approach.

Security problems are reported privately, never in a public issue. See [SECURITY.md](SECURITY.md).

## Set up a development environment

You need Docker, [uv](https://docs.astral.sh/uv/), Python 3.12 or newer (uv can install it) and Node 22.18 or newer.

```bash
git clone https://github.com/BenAbdou1001/creator-analytics.git
cd creator-analytics
docker compose up -d                                    # Postgres 17 on 127.0.0.1:5433
cd backend && uv sync && uv run alembic upgrade head    # dependencies, schema, views, metric catalogue
uv run fastapi dev main.py --port 8000                  # http://localhost:8000/docs
```

In a second terminal:

```bash
cd web && npm install && npm run dev                    # http://localhost:3000
```

The [installation guide](docs/guides/installation.md) covers each step in more detail, including demo data.

## Before you open a pull request

Run the same checks as CI:

```bash
cd backend && uv run pytest                             # needs the database from docker compose
cd web && npm run typecheck && npm test && npm run build
```

CI runs the backend tests on Python 3.12, 3.13 and 3.14, and the web checks on Node 22.

## Project conventions

**Data safety**

- Tests run against their own `creator_test` database. Never point tests, or `scripts/seed_demo.py`, at a database with
  real data.
- Never commit real exports, database dumps or `.env` files. Use invented data in tests, examples and screenshots.

**Backend**

- Schema changes go in a new Alembic migration: `cd backend && uv run alembic revision -m "..."`.
- REST endpoints and MCP tools call the same services. Put logic in `backend/app/creator/service/`, not in either entry
  point. See the [system overview](docs/architecture/system-overview.md).
- If you change an MCP tool, update its docstring: it is what AI clients read to decide how to call the tool.

**Web**

- Import a feature only through its `index.ts` (`web/src/features/<name>/index.ts`).
- Use the role tokens in `web/src/shared/styles/globals.css` (`primary`, `muted`, `warning`…), not hex values.
- Show every metric through the `Sounding` component. `—` means "no data" and is never the same as `0`.
- Pure helpers can have a `*.check.mjs` self-check next to them; add it to the `test` script in `web/package.json`.

## Commits and pull requests

- Write commit messages in the imperative mood ("Add LinkedIn follower import", not "Added…").
- Keep one topic per pull request and fill in the pull request template.
- Add an entry under **Unreleased** in [CHANGELOG.md](CHANGELOG.md) for user-visible changes.
