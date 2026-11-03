# Upload flow

The upload lifecycle is multi-step. A session alone uploads nothing.

> Creating an upload session does not itself return the final upload URL for each track. Each track requires its own track-creation request.

## Required sequence

1. **Create an upload session** (server, Bearer)  
   `POST /v1/upload_session`  
   Body typically includes `collection_id` (and optional metadata / `expires_in`).  
   Returns `upload_session_id`.

2. **Create a separate track inside that upload session** (no Bearer — session ID is the credential)  
   `POST /v1/upload/{upload_session_id}/track`  
   Body includes `file_name` (and optionally `organization_index`, `metadata`,
   `player_title`, `player_subtitle`, `player_color`, `is_cover_overridable`,
   `is_theme_overridable` — the same track fields as `POST /v1/track`).  
   Returns `track_id`, the full `track` object (including `track.base_path` and
   `track.base_url`), and `track_upload` with `method`, `upload_url`, TTL/expiry.
   All three track creators (`POST /v1/track`, the nested `track` on
   `POST /v1/upload_session`, and this endpoint) return the same `track` shape.

3. **Receive the track-specific upload URL** from that track-creation response  
   (`track_upload.upload_url`). Do this once per file.

4. **Upload bytes** to that URL using `track_upload.method` (typically `PUT`).  
   The URL is short-lived and single-use — do not store it in a database or config.

5. **Wait for processing readiness** — poll `GET /v1/track/{track_id}` (Bearer) until a terminal status, or use the Track Processing webhook (preferred in production; see `references/webhooks.md`).

6. **Request playback or delivery** only after the required output/track file is ready.

## Persist the IDs (link uploads to playback)

The upload returns **durable** handles — store these in your database and treat
them as the long-lived reference to the audio:

- `track_id` — the durable ID for one track.
- `collection_id` — the durable grouping the track belongs to.
- output delivery `index` (e.g. `hq`, `lq`) — the durable output selector.
- `track.base_path` / `track.base_url` — the durable delivery prefix for the
  track's output files. Each output file is that prefix plus an index suffix
  and extension (e.g. `{base_url}_128.mp3`). `base_url` is `base_path` served
  from the organization's unique `audiodelivery.net` subdomain — store it if you
  use signed delivery, then HMAC-sign the resulting URLs. Never upload to it.

Later, create a play session (or sign a delivery URL) from the stored
`track_id` / `collection_id` to play or download — that is how an upload links to
playback.

### Client-side uploads: notify your server

When bytes are uploaded from the browser / app (a Client-Side Upload key or the
Uploader / Recorder component), the durable IDs first exist on the client. Relay
them to your server on success — the component's `file-uploaded` event carries the
`trackId`. Persist `track_id` (and, if you plan to sign delivery URLs later, the
stored `track.base_url` / `base_path`). Do not treat the client `file-uploaded`
signal as "ready"; still gate playback on processing readiness.

Do **not** store these **ephemeral** values; re-request them when needed:

- `track_upload.upload_url` (short-lived, single-use)
- `upload_session_id` / `play_session_id` (short-lived capability tokens)
- signed delivery URLs (expire on the signature TTL)

## Optional convenience (single-file / first file)

OpenAPI allows an optional nested `track` object on `POST /v1/upload_session`
(same fields as the per-track request), which returns the same first-file
`track`/`track_upload` response fields in one request. This is ideal for
**single-file** uploads (e.g. the voice Recorder component, which uses it to
create the session and track in one call). It does **not** replace the rule
above for multi-track uploads: every additional track still needs
`POST /v1/upload/{upload_session_id}/track`. Prefer teaching the explicit
per-track request so agents never skip step 2.

## Critical pitfalls

- Expecting `upload_url` from session create alone
- Treating `upload_url` as permanent
- Starting playback before `track_status_id` is ready (or terminal `incomplete` with a usable file)
- Using the marketing host for `/v1/` calls

Canonical: https://audiodeliverynetwork.com/docs/api/upload-sessions  
OpenAPI operationIds: `createUploadSession`, `createUploadSessionTrack`.
