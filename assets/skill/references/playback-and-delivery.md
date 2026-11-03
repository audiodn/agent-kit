# Playback and delivery

Gate all delivery on processing readiness. Pick one playback terminal per surface
(`references/choosing-an-integration.md`) and keep it consistent.

Consumers are broad: the ADN Player component, a custom web/native player,
**downloads**, or a **programmatic / non-visual** consumer (e.g. telephony /
answering-machine playback). A server-created session returns signed output URLs
any of these can use.

## Play sessions (per-listener)

`POST /v1/play_session/{scope}`, scope `track` or `collection` (`playlist` is
unsupported — the handler currently errors). Authorized by a **Bearer** key that
is **either** an API Access key on the server **or** a scoped Client-Side Player
key used in-client (the two calls look nearly identical; only the key differs):

- Body must include a non-empty `variants` array of **output indexes** (from
  `GET /v1/output_preset`; legacy `GET /v1/variant`). `variants` is the
  historical wire key; the API also accepts `output_indexes` when `variants` is
  omitted. Also pass `track_id` or `collection_id`, optional `expires_in`
  (seconds; default 3600, min 60, max 86400) and `is_downloadable`.
- Returns `play_session_id` and `first_track` with signed `variants[].url`,
  waveform `levels`, and cover sizes. Pass the session ID to the ADN Player;
  use signed URLs only with a custom player.
- More tracks: `GET /v1/play/{play_session_id}/{play_track_id}` (no Bearer — the
  session ID authorizes). `GET /v1/play_session/{play_session_id}` is also
  session-gated (no Bearer).

## Downloads

Downloads require a session created with `is_downloadable: true`.

1. Create the play session with `is_downloadable: true` (and the download output
   index in `variants`).
2. `GET /v1/play/{play_session_id}/{play_track_id}/{variant_index}/download`
   (no Bearer) returns a short-lived download URL. Path segment is an output
   index (`variant_index` is the historical name).
3. Serve that URL to the client, or use `<audiodn-player downloadable>` — the
   attribute only works when the underlying key/session permits downloads.

## Signed delivery (public / entitled)

Sign delivery URLs on your server or edge with a URL Signing key (HMAC-SHA256),
bypassing play sessions and the ADN round trip at play time. Append the `verify`
query parameter **last**. The MAC covers `pathname + query + issued` (unix
seconds); the token is `{issued}-{base64url_mac}`. Full algorithm:
https://audiodeliverynetwork.com/docs/api/signing-keys (not fully spelled in
OpenAPI). The signing secret never goes to the client. Deliver the signed URL to
the client directly or via a server redirect. This skips play sessions entirely —
do not also mint a play session for the same stream, and do not feed signed URLs
to the ADN Player (the player accepts only a client key or `play-session-id`).

Build the URL to sign from the `track.base_url` returned by every
track-creation response (a durable prefix on the organization's unique
`audiodelivery.net` subdomain): append the output index suffix and extension, e.g.
`{base_url}_lq.mp3`, then sign. `track.base_path` is the same prefix without
the host, for when you construct the host yourself.

## Inline share

`GET /v1/stream/{track_id}/{share_key}` validates an Inline Share key and returns
302 to a short-lived signed CDN URL for that key's single output index. No Bearer
header. See https://audiodeliverynetwork.com/docs/api/share.

## Components

Pass a Client-Side Player key **or** a server-provisioned `play-session-id` to
`<audiodn-player>` — never both, and never an API Access key. See
`references/web-components.md`.

Canonical: https://audiodeliverynetwork.com/docs/api/play-sessions and
https://audiodeliverynetwork.com/docs/integration/playback?playback=signed-delivery
OpenAPI: `createPlaySession`, `getPlayTrack`, `downloadPlayTrackVariant`.
