# MCP setup

Creator Analytics includes a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server. It lets an AI
client such as Claude or Codex read your analytics and add or change data, using the same business logic as the web app.

## How it works

- The server is the `creator-mcp` command defined in `backend/pyproject.toml`
  (`backend/app/mcp_server.py`).
- It uses the **stdio** transport: the AI client starts it as a local subprocess. It does not open a network port and
  there is no hosted version.
- Each tool call is one database transaction and calls the same service as the matching REST endpoint, so validation,
  upserts and provenance (`import_batches`) are identical.
- It connects to the database in `DATABASE_URL`. **MCP clients generally do not pass your shell's environment to the
  server**, so set `DATABASE_URL` in the client configuration or in `backend/.env`. Without it, the server uses the
  default `postgresql://creator:creator@localhost:5433/creator`.

Before connecting a client, complete the [installation](installation.md) up to step 3 (database running, `uv sync` and
`alembic upgrade head` done). The API and web app do not need to be running.

Check that the server starts:

```bash
cd backend && uv run creator-mcp   # waits silently for a client on stdin; stop it with Ctrl+C
```

## Supported clients

| Client | Connection | Status |
|---|---|---|
| Claude Code | Project-level `.mcp.json` in this repository (stdio) | Used during development of this project, including the `draft_briefs` prompt |
| Claude Desktop | `claude_desktop_config.json` (stdio) | Documented configuration |
| OpenAI Codex CLI | `codex mcp add` or `~/.codex/config.toml` (stdio) | Configuration checked against `codex mcp add` in codex-cli 0.139 |

Any other client that can launch a stdio MCP server should work with the same command, but has not been tested.

### Claude Code

The repository's [`.mcp.json`](../../.mcp.json) registers the server for this project:

```json
{
  "mcpServers": {
    "creator-analytics": {
      "command": "uv",
      "args": ["run", "--directory", "backend", "creator-mcp"],
      "env": { "DATABASE_URL": "postgresql://creator:creator@localhost:5433/creator" }
    }
  }
}
```

Start Claude Code from the repository root and approve the `creator-analytics` server when asked. Run `/mcp` to check
that it is connected. If your database is elsewhere, change `DATABASE_URL` in your local copy, or remove the `env` block
and set it in `backend/.env`.

To use the server from other folders, add it at user scope with an absolute path:

```bash
claude mcp add creator-analytics --scope user \
  --env DATABASE_URL=postgresql://creator:creator@localhost:5433/creator \
  -- uv run --directory /ABSOLUTE/PATH/creator-analytics/backend creator-mcp
```

### Claude Desktop

Open **Settings › Developer › Edit Config** and add the server to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "creator-analytics": {
      "command": "uv",
      "args": ["run", "--directory", "/ABSOLUTE/PATH/creator-analytics/backend", "creator-mcp"],
      "env": { "DATABASE_URL": "postgresql://creator:creator@localhost:5433/creator" }
    }
  }
}
```

Use an absolute path, and the full path to `uv` (`which uv`) if Claude Desktop cannot find it. Restart Claude Desktop.

### OpenAI Codex CLI

```bash
codex mcp add creator-analytics \
  --env DATABASE_URL=postgresql://creator:creator@localhost:5433/creator \
  -- uv run --directory /ABSOLUTE/PATH/creator-analytics/backend creator-mcp
```

This writes the following to `~/.codex/config.toml`, which you can also edit by hand:

```toml
[mcp_servers.creator-analytics]
command = "uv"
args = ["run", "--directory", "/ABSOLUTE/PATH/creator-analytics/backend", "creator-mcp"]

[mcp_servers.creator-analytics.env]
DATABASE_URL = "postgresql://creator:creator@localhost:5433/creator"
```

Check it with `codex mcp list`.

## Tools

All tools return JSON. Table and column names are those of the `creator` schema; call `describe_schema` to see them.

### Read

| Tool | Purpose | Main parameters |
|---|---|---|
| `describe_schema` | All tables and views with columns, types, required flags, primary keys and enum values. Agents should call it first. | — |
| `read_rows` | Read rows from any table or view, with filters, sorting and paging. Returns `{rows, total}`. | `table`, `filters` (`{"col": v}` or `{"col__op": v}` with `eq ne gt gte lt lte like isnull`), `limit`, `offset`, `order_by`, `descending` |
| `dashboard_overview` | Per-account headline numbers: followers, post count, views, engagements, last import. | — |
| `metric_timeseries` | One account-level metric over time (latest capture per period). | `account_id`, `metric_key`, `start`, `end` (YYYY-MM-DD), `period_kind` |
| `expiring_metrics` | What each account has saved of the metrics its platform deletes, most urgent first, with where to export them. | — |
| `posts_needing_briefs` | Posts without a content brief, plus the vocabulary already used in briefs and the allowed enum values. | `account_id`, `limit` |

### Write

| Tool | Purpose | Main parameters |
|---|---|---|
| `create_rows` | Insert one or more rows into a table in one transaction, e.g. accounts or content briefs. | `table`, `rows` |
| `update_row` | Update one row by its full primary key. | `table`, `key`, `data` |
| `delete_row` | Delete one row by its full primary key. Deleting an account cascades to its content, facts, batches and relationships. | `table`, `key` |
| `sync_content` | Upsert posts and record a metrics snapshot for each. Optionally mark missing posts as deleted. | `account_id`, `items`, `full_snapshot`, `period_kind` |
| `sync_account_metrics` | Record account-level metric values for days or ranges. | `account_id`, `rows`, `scope` |
| `sync_revenue` | Record earnings per source, period and currency. | `account_id`, `rows` |
| `sync_relationships` | Sync a follower / subscriber / connection list and infer who left. | `account_id`, `relation`, `people`, `full_snapshot` |
| `import_file` | Import a platform export from a local file path (CSV, or the LinkedIn `.xlsx`). | `account_id`, `path`, `kind` |

Views (`v_*`) are read-only. Metric names in sync tools can be the `metric_key` or the label shown in the platform's
interface.

### Prompts

| Prompt | Purpose |
|---|---|
| `draft_briefs` | Walks the agent through drafting a content brief for every post that has none. Optional argument: `account_id`. |

## Example requests

These work with the tools above. The agent decides which tools to call.

- "Compare my views per post on YouTube and TikTok over the last three months."
  → `describe_schema`, `read_rows` on `v_content_performance` filtered by date.
- "Which of my posts had the highest engagement rate this year, and what hook did they use?"
  → `read_rows` on `v_content_performance`, ordered by `engagement_rate`.
- "Show my daily LinkedIn impressions for October."
  → `metric_timeseries`.
- "What do I need to export this week before the platforms delete it?"
  → `expiring_metrics`.
- "Import `~/Downloads/Content 2026-11-01.csv` into my YouTube account."
  → `read_rows` on `accounts`, then `import_file`.
- "Tag my last five posts with the topic 'woodworking' and fix the caption of the bench tour video."
  → `create_rows` on `content_briefs`, `update_row` on `content_items`.

## Drafting briefs with an agent

After an import, the Posts and Import pages show how many posts have no brief. In Claude Code, run the prompt:

```text
/mcp__creator-analytics__draft_briefs
```

The agent calls `posts_needing_briefs`, reads each post (opening its public URL when the caption is incomplete), and
writes one brief per post with `create_rows`, flagged `needs_review`. Each draft shows a banner on its post page;
**Looks right**, or saving a fix, clears it. In clients without prompt support, ask the agent to "draft briefs for my
posts that have none"; the server instructions and `posts_needing_briefs` describe the same steps.

## Safety

The MCP server has the same rights as the REST API: it can read, change and delete everything, and `import_file` can
read any local file the server process can read. Keep tool approval turned on for write and delete tools in your client,
and only connect clients you trust. See [SECURITY.md](../../SECURITY.md).
