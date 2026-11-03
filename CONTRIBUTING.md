# Contributing

Thanks for helping. Small, focused pull requests are easiest to review.

## Set up

Follow "Run it" in the [README](README.md). Then, before opening a pull request:

```bash
cd backend && uv run pytest             # needs the database from docker compose
cd web && npm run typecheck && npm run build
```

CI runs the same checks.

## Ground rules

- Tests run against a separate `creator_test` database. Never point them, or `scripts/seed_demo.py`, at a database with
  real data.
- Never commit real exports, database dumps or `.env` files. Use invented data in tests and examples.
- Schema changes go in a new Alembic migration: `cd backend && uv run alembic revision -m "..."`.
- REST endpoints and MCP tools call the same services. Put logic in `app/creator/service/`, not in either entry point.
- UI follows [docs/brand/GUIDE.md](docs/brand/GUIDE.md): role tokens, not hex values, and `Sounding` for every number.
- Import features only through their `index.ts`.

## Reporting bugs

Open an issue with steps to reproduce, what you expected and what happened. Strip personal data from any export you
attach. Report security problems privately, as described in [SECURITY.md](SECURITY.md).
