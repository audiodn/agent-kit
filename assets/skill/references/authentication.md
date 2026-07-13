# Authentication reference

## Credential types

- **API Access key** — `Authorization: Bearer <key>`. Full server-side access.
  Server-only. Used to create upload sessions, read track status, create play
  sessions, and manage resources.
- **Client-Side keys** (Player / Uploader) — scoped keys safe to ship to a
  browser/app, but ONLY for the AudioDN web components.
- **Session IDs as capability tokens** — some endpoints are authorized purely by
  a session ID in the path and take NO `Authorization` header.

## Session-gated endpoints (no Bearer)

- `GET  /v1/upload_session/{upload_session_id}`
- `POST /v1/upload/{upload_session_id}/track`
- `GET  /v1/play/{play_session_id}/{play_track_id}`
- `GET  /v1/play/{play_session_id}/{play_track_id}/{variant_index}/download`

## Rules

- The browser holds only a Client-Side key or a session ID/signed URL provisioned
  by your server.
- Read keys from environment variables; never hardcode them.
- Errors use `{ ok: false, message, api_request_id }` with 400/401/404/500.

Canonical: https://audiodeliverynetwork.com/docs/api and `/openapi.json`.
