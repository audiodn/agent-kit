## Playback and delivery

Two supported ways to deliver audio, both gated by readiness:

- **Play sessions**: `POST /v1/play_session/{scope}` (server, Bearer) requires a
  non-empty `variants` list of delivery indexes. Returns `play_session_id` and
  signed variant URLs in `first_track.variants[].url` plus waveform `levels`.
  Pass the session ID to the ADN Player; use signed URLs only with a custom
  player. Fetch more tracks with
  `GET /v1/play/{play_session_id}/{play_track_id}` (no Bearer).
- **Signed delivery**: sign a delivery URL on your server with a URL Signing key
  (HMAC-SHA256; the `verify` query param must be appended **last**). Skips play
  sessions for public/entitled tracks. The signing secret is server-only. Build
  the URL from the durable `track.base_url` returned at track creation, plus the
  variant suffix and extension (e.g. `{base_url}_lq.mp3`).
- **Inline share**: `GET /v1/stream/{track_id}/{share_key}` redirects 302 to a
  signed CDN URL.

For components, pass a Client-Side Player key **or** a server-provisioned play
session ID to `<audiodn-player>` — never both, never a signed URL. See
`references/playback-and-delivery.md` in the Skill.
