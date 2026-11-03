# Reading catalog and metadata

How to fetch track, collection, and output-preset information using the durable
IDs you stored at upload time. Server reads use an API Access key (Bearer);
session-gated reads use a session ID and take no Authorization header.

## Server reads (API Access Bearer)

- `GET /v1/track/{track_id}` — one track row: metadata, `track_status_id`,
  `format`, `duration`, waveform `levels`, `cloudflare_image_id`, and when
  provisioned `transcription` / `transcription_language`. (`getTrack`)
  `cover_image` size URLs appear on **play-session** payloads, not on this GET.
  `base_path` / `base_url` are returned on **create** responses.
- `GET /v1/collection/{collection_id}` — one collection. (`getCollection`)
- `GET /v1/collection` — list collections (`limit` max 100, `offset`). (`listCollections`)
- `GET /v1/collection/{collection_id}/track` — list tracks in a collection.
  (`listCollectionTracks`)
- `GET /v1/output_preset` — list org output presets (`index`, type id, `props`);
  `GET /v1/output_preset/{output_preset_id}` — one preset.
  (`listOutputPresets`, `getOutputPreset`; legacy: `/v1/variant`, `listVariants`)

## Session-gated reads (no Bearer — session ID authorizes)

- `GET /v1/play_session/{play_session_id}` — inspect a play session. (`getPlaySession`)
- `GET /v1/play/{play_session_id}/{play_track_id}` — a track within a play session,
  including signed `variants[].url` (wire field for output indexes). (`getPlayTrack`)
- `GET /v1/upload_session/{upload_session_id}` — inspect an upload session.
  (`getUploadSession`)

## Where collection IDs come from

Create a collection before uploading if you do not have one:
`POST /v1/collection` with `{ "title": "..." }` returns the `collection_id`
(`createCollection`). Store it. Cover images are provisioned via
`POST /v1/collection/{collection_id}/cover` and `POST /v1/track/{track_id}/cover`
(see the Cover Images API).

## Notes

- `track.track_status_id === 'ready'` (or a usable `incomplete`) gates playback —
  see `references/processing-and-variants.md`.
- Prefer the ready-made `cover_image` size URLs on play-session / play-track
  responses over rebuilding them from `cloudflare_image_id`.

Canonical: https://audiodeliverynetwork.com/docs/api/tracks,
https://audiodeliverynetwork.com/docs/api/collections,
https://audiodeliverynetwork.com/docs/api/variants (output presets)
