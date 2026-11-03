# Processing and outputs

After bytes upload, AudioDN processes the track (probe, waveform/levels, output
generation, optional fallback processing, cover extraction). A track is not
immediately playable.

## Readiness

- **Poll** (server, Bearer): `GET /v1/track/{track_id}` until
  `track.track_status_id === 'ready'`.
- Live field is always `track.track_status_id`. Transitional:
  `initialized`, `processing`, `fallback`, `fallback_processing`. Terminal:
  `ready`, `incomplete` (some variants failed but at least one may play),
  `error`, `init_error`. Do not poll a legacy `status` field or enums such as
  `initializing` / `failed`.
- **Webhook** (preferred in production): Track Processing webhook fires on
  terminal outcomes / when the file set completes (`files_completed_at`), not on
  every transitional status. Dashboard-configured; header `X-ADN-Event: track.status_changed`.
  See `references/webhooks.md` for all three webhooks (processing, track files, collection sync).

Do not assume a just-uploaded track is ready. The uploader component’s
`file-uploaded` event means bytes were stored — not that processing finished.

## Output presets (format standardization)

- An **output preset** is a reusable recipe (`output_type_id` / legacy
  `variant_type_id`, delivery `index` such as `hq`, `lq`, `voice`).
- An **output** is the result of applying a preset to a track (stored file and/or
  related data such as a transcript). Files live under the track's delivery
  prefix — `track.base_path` / `track.base_url` from the track-creation response —
  plus an index suffix and extension (e.g. `{base_url}_preview.mp3`).
- Track-scoped API creation supports types such as `transcode` and `preview`
  (lossy codecs include `aac`, `mp3`, `ogg`, `opus` per docs). Preview bodies may
  include `preview_type`, `preview_seconds` / percent fields, and
  `preview_start_percent`. Optional `is_required` and `notes` are accepted.
  Org-wide recipes (analysis, waveform assets, original) are configured in the
  dashboard. Transcription fields on the track are org-provisioned, not a
  self-serve preset. (Output presets were previously called variants.)

Canonical endpoints: `GET /v1/output_preset`, `GET /v1/output_preset/{output_preset_id}`,
`POST /v1/track/{track_id}/output`. Legacy aliases `/v1/variant` and
`/v1/track/{track_id}/variant` remain supported.

## Terminology — “normalization”

AudioDN does **not** perform LUFS loudness normalization, true-peak limiting,
dynamic-range processing, or gain normalization unless explicitly documented
elsewhere (it is not part of the current product API). Prefer:

- Format standardization
- Playback standardization
- Transcoding to a consistent variant

Say “supported input formats,” not “every audio format.”

Waveform **levels** may be scaled 0–1 for visualization (`is_normalize` in
analysis/waveform contexts) — that is display data, not loudness mastering.

Canonical: https://audiodeliverynetwork.com/docs/variant-types and
`/docs/webhooks/track-processing`.
