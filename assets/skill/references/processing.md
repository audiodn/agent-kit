# Processing reference

After the bytes upload, AudioDN processes the track (probe, waveform, variants,
optional fallback processing, cover extraction). A track is not immediately
playable.

## Detect readiness

- **Poll** (server, Bearer): `GET /v1/track/{track_id}` until
  `track.track_status_id === 'ready'`. Terminal states also include
  `incomplete` (some variants failed but at least one plays), `error`,
  `init_error`.
- **Webhook** (preferred): the Track Processing webhook fires on terminal
  outcomes / when the file set is complete (`files_completed_at`), not on every
  transitional status.

## Statuses you may observe

`processing`, `fallback_processing` (retry on higher-capacity worker), then a
terminal state. Do not assume a just-uploaded track is `ready`.

Canonical: https://audiodeliverynetwork.com/docs and `/docs/webhooks/track-processing`.
OpenAPI operationId: `getTrack`.
