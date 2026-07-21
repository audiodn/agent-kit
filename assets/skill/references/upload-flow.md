# Upload-flow reference

The upload lifecycle is multi-step. A session alone uploads nothing.

## Steps

1. **Create upload session** (server, Bearer)
   `POST /v1/upload_session` with optional `{ collection_id }`.
   Returns `upload_session_id`. Holds many tracks; returns no upload URL.

2. **Create a track in the session** (no Bearer)
   `POST /v1/upload/{upload_session_id}/track` with `{ file_name }` (plus the
   same optional track fields as `POST /v1/track`: `organization_index`,
   `metadata`, `player_title`, `player_subtitle`, `player_color`,
   `is_cover_overridable`, `is_theme_overridable`).
   Returns `track_id`, the full `track` object — including the durable delivery
   prefix `track.base_path` / `track.base_url` (each variant file is that prefix
   plus a suffix and extension, e.g. `{base_url}_128.mp3`) — and
   `track_upload` = `{ method, upload_url }`.
   Do this once per file. All three track creators (`POST /v1/track`, the nested
   `track` on `POST /v1/upload_session`, and this endpoint) return the same
   `track` shape.

3. **Upload the bytes**
   `PUT` the file to `track_upload.upload_url` using `track_upload.method`.
   Processing begins automatically once the PUT completes.

4. **Wait for readiness** (see processing.md) before playback.

## Critical

- The per-track `upload_url` is short-lived and single-use. Never store it in a
  DB, cache, or config; if it expires, create a fresh track and retry.
- The session-create step does NOT return `upload_url` — do not expect one.
- `track.base_path` / `track.base_url` ARE durable — store them (with `track_id`)
  if you use signed delivery. `base_url` lives on the organization's unique
  `audiodelivery.net` subdomain. Never upload to it.

Canonical: https://audiodeliverynetwork.com/docs/api/upload-sessions
OpenAPI operationIds: `createUploadSession`, `createUploadSessionTrack`.
