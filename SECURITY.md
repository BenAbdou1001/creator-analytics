# Security

## Deployment model

Creator Analytics is a single-user app with **no authentication**. The REST API and the MCP server can read, change
and delete every row. Keep both reachable only from your own machine:

- `fastapi dev` binds to `127.0.0.1`; keep it that way, or put an authenticating proxy in front.
- `docker-compose.yml` publishes Postgres on `127.0.0.1:5433` only, with a development password. Change the password if
  anything else can reach that port.
- CORS allows only `localhost` origins by default (`CORS_ORIGIN_REGEX`).

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting: the **Security** tab of this
repository, then **Report a vulnerability**. You should get a reply within a week.
