# Upload-flow reference

The upload lifecycle is multi-step. A session alone uploads nothing.

## Steps

1. **Create upload session** (server, Bearer)
   `POST /v1/upload_session` with optional `{ collection_id }`.
   Returns `upload_session_id`. Holds many tracks; returns no upload URL.

2. **Create a track in the session** (no Bearer)
   `POST /v1/upload/{upload_session_id}/track` with `{ file_name }`.
   Returns `track_id` and `track_upload` = `{ method, upload_url }`.
   Do this once per file.

3. **Upload the bytes**
   `PUT` the file to `track_upload.upload_url` using `track_upload.method`.
   Processing begins automatically once the PUT completes.

4. **Wait for readiness** (see processing.md) before playback.

## Critical

- The per-track `upload_url` is short-lived and single-use. Never store it in a
  DB, cache, or config; if it expires, create a fresh track and retry.
- The session-create step does NOT return `upload_url` — do not expect one.

Canonical: https://audiodeliverynetwork.com/docs/api/upload-sessions
OpenAPI operationIds: `createUploadSession`, `createUploadSessionTrack`.
