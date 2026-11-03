# Authentication

## Credential types

| Type | Where | Role |
|------|-------|------|
| **API Access** | Server only | Full API access via `Authorization: Bearer <key>`. Mint client keys; create upload/play sessions; manage resources. Created in the dashboard, not via public `POST /v1/api_key`. |
| **Client-Side Player** (`player`) | Browser / app / `<audiodn-player>` | Playback-scoped. Can create play sessions in-client. |
| **Client-Side Uploader** (`uploader`) | Browser / app / `<audiodn-uploader>` | Upload-scoped. Can create upload sessions in-client. |
| **Inline Share** (`share`) | Public share path | Single-variant inline share via `GET /v1/stream/{track_id}/{share_key}`. Creatable via `POST /v1/api_key` or the dashboard. Exactly one variant; `expires_at` ignored. |
| **URL Signing key** | Server / edge only | HMAC-SHA256 signed delivery URLs. Dashboard-only (not creatable via `POST /v1/api_key`). |
| **Session IDs** | Path capability tokens | Authorize specific upload/play endpoints without Bearer |

## Who creates sessions

Play sessions (`POST /v1/play_session/{scope}`) and upload sessions
(`POST /v1/upload_session`) are authorized by a **Bearer** key that is **either**:

- an **API Access key** on the server, **or**
- a scoped **Client-Side** Player / Uploader key used in-client (the component or
  app holds it).

The two calls look nearly identical — only the key differs. The real invariant is
**never ship the API Access key to a client**. A scoped Client-Side key and a
session ID are the client-safe credentials. Session creation is not inherently
server-only.

## Minting client-side keys

`POST /v1/api_key` (API Access Bearer required) creates `player`, `uploader`, or
`share` keys only. API Access and URL Signing keys are created in the dashboard,
not via this endpoint. Scoping and lifetime:

- `title` and `api_key_type_id` (`player` | `uploader` | `share`) required.
- `collection_id` limits the key to one collection; `track_id` limits to a track
  (requires `collection_id`); `creator_id` limits to a creator.
- `variants` — allowed delivery indexes (required, exactly one, for `share`;
  optional for `player`).
- `expires_at` — optional for `player` / `uploader`; **omit for a key that never
  expires** (ignored for `share`).
- The full key is returned **once** and is never retrievable again — store it
  securely.

## Session-gated endpoints (no Bearer)

- `GET /v1/upload_session/{upload_session_id}`
- `POST /v1/upload/{upload_session_id}/track`
- `GET /v1/play_session/{play_session_id}`
- `GET /v1/play/{play_session_id}/{play_track_id}`
- `GET /v1/play/{play_session_id}/{play_track_id}/{variant_index}/download`

Inline share uses the share key in the path (also no Bearer):
`GET /v1/stream/{track_id}/{api_key}`.

## Rules

- Secrets come from environment variables or the platform’s secure credential mechanism.
- Never hardcode `adn_...` keys or Bearer tokens in source, samples, or logs.
- Never put API Access keys in browser bundles, mobile apps, or `public/` assets.
- Client-side keys only in their documented component/API scopes.
- Errors typically use `{ ok: false, message, api_request_id }` with 400/401/404/500.

Canonical: https://audiodeliverynetwork.com/docs/api and
https://audiodeliverynetwork.com/openapi.json
