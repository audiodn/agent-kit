## Processing and readiness

After the bytes are uploaded, AudioDN processes the track: probing, waveform
generation, variant transcodes/previews, optional fallback processing, and cover
extraction. This takes time, so a track is not playable the instant it uploads.

Determine readiness in one of two ways:

- **Poll**: `GET /v1/track/{track_id}` (server, Bearer) until
  `track.track_status_id === 'ready'` (or a terminal state like `incomplete`,
  `error`, `init_error`).
- **Webhook** (preferred in production): react to the Track Processing webhook,
  which fires on terminal outcomes / when the file set is complete — not on every
  transitional status.

Never build a playback experience that assumes a just-uploaded track is ready.
See `references/processing.md` in the Skill.
