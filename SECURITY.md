# Security

## Supported versions

The project has no tagged releases yet. Security fixes go to the `main` branch.

## Deployment model

Creator Analytics is a single-user, self-hosted app with **no authentication**. The REST API and the MCP server can
read, change and delete every row. Keep both reachable only from your own machine:

- `fastapi dev` binds to `127.0.0.1`. Keep it that way, or put an authenticating proxy in front.
- `docker-compose.yml` publishes Postgres on `127.0.0.1:5433` only, with a development password. Change the password if
  anything else can reach that port.
- CORS allows only `localhost` origins by default (`CORS_ORIGIN_REGEX`, see the
  [configuration guide](docs/guides/configuration.md)).
- The MCP server runs as a local process (stdio) with the same rights as the REST API, including `delete_row` and
  `import_file`, which reads any file path the server process can read. Only connect AI clients you trust, and review
  write and delete tool calls before approving them.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting: the **Security** tab of this
repository, then **Report a vulnerability**. You should get a reply within a week.
