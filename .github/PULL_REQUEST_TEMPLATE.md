## What changed

<!-- A short summary of the change. Link the issue it closes, e.g. "Closes #12". -->

## Why

<!-- The problem this solves or the reason for the change. -->

## How it was tested

<!-- Commands you ran and what you checked by hand. -->

- [ ] `cd backend && uv run pytest`
- [ ] `cd web && npm run typecheck && npm test && npm run build`
- [ ] Checked the change in the running app or through an MCP client, if it affects them

## Documentation

- [ ] Not needed
- [ ] Updated (README, `docs/`, or docstrings of changed MCP tools)

## Checklist

- [ ] Schema changes are in a new Alembic migration
- [ ] New logic lives in `backend/app/creator/service/`, shared by the REST API and the MCP server
- [ ] No real exports, database dumps, `.env` files or personal data are included
