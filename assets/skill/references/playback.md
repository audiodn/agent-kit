# Playback reference

Two supported delivery paths, both gated by readiness.

## Play sessions (per-listener)

`POST /v1/play_session/{scope}` (server, Bearer), scope `track` or `collection`:

- Body: `{ track_id | collection_id, variants?, expires_in?, is_downloadable? }`.
- Returns signed variant URLs in `first_track.variants[].url` and waveform data
  in `first_track.levels`.
- Fetch more tracks: `GET /v1/play/{play_session_id}/{play_track_id}` (no Bearer).
- Downloads: `GET /v1/play/{play_session_id}/{play_track_id}/{variant_index}/download`
  (only if the session is downloadable).

## Signed delivery (public/entitled, no session)

Sign a delivery URL on your server with a URL Signing key (HMAC-SHA256). The
`verify` query parameter must be appended LAST. The signing secret is
server/edge-only. Skips play sessions for public tracks.

## Components

Pass a Client-Side Player key or a server-provisioned play session ID to
`<audiodn-player>`. Do not embed a server key.

Canonical: https://audiodeliverynetwork.com/docs/api/play-sessions and
`/docs/integration/signed-delivery`.
OpenAPI operationIds: `createPlaySession`, `getPlayTrack`, `downloadPlayTrackVariant`.
