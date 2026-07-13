# Security reference

## Principles

- **Server key isolation**: API Access keys (Bearer) live only in server code and
  server-side env vars. Never in browser bundles, mobile apps, `public/` assets,
  client components, or committed files.
- **No hardcoded secrets**: read keys and signing secrets from environment
  variables. Never inline an `adn_...` key, `Bearer` token, or signing secret.
- **Signing secret stays server/edge-side**: URL signing happens on your server
  or an edge worker; the secret is never sent to the client.
- **Least privilege on the client**: resource-scoped Client-Side keys and
  short-lived, per-listener play sessions.

## What the validator enforces

The bundled `scripts/validate.mjs` flags:

- `server-key-in-client` (error) — server credential referenced in client code.
- `invented-endpoint` (error) — `/v1/...` path not in the OpenAPI.
- `missing-per-track-request` (warn) — session created, no per-track upload URL.
- `upload-url-treated-permanent` (warn) — `upload_url` persisted/cached.
- `playback-before-ready` (warn) — playback with no readiness gate.
- `hardcoded-secret` (error) — literal key/secret in source.
- `incorrect-api-origin` (error) — wrong host for `/v1/` (e.g. marketing host).
- `obsolete-doc-url` (warn) — deprecated paths/params (`/v1/upload-session`,
  `ttl_seconds`, `session.url`, docs-on-API-host, etc.).

Configure exceptions in `.audiodn-validate.json` (`{ "ignore": [], "ignoreFiles": [] }`)
or add `audiodn-validate-ignore` on a specific line.
