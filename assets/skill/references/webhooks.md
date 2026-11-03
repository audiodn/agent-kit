# Webhooks

Webhooks are the production way to learn when a stored `track_id` becomes
playable and to keep local `collection` / `track` records in sync — without
polling. Three independent webhooks exist; enable whichever you need.

## Shared delivery model

- Configured in the dashboard (**Settings -> Webhook**), not via the API.
- HTTP `POST`, `Content-Type: application/json`, with an `X-ADN-Event` header.
- Delivery is at-least-once, fire-and-forget, and unordered.
- Requests are currently **unsigned** — treat the URL as a secret and, if needed,
  verify IDs against the API.
- Respond with `2xx` quickly, then process asynchronously. Make handlers
  **idempotent**; key on IDs, not arrival order.

## Track Processing (`X-ADN-Event: track.status_changed`)

React to a track's overall outcome. Fires only on:

- terminal statuses: `ready`, `incomplete`, `error`, `init_error`; and
- files-complete: `track.files_completed_at` is stamped once every variant has
  been attempted.

Transitional states (`initialized`, `processing`, `fallback`,
`fallback_processing`) are **not** relayed. A track may deliver twice: an early
`ready` (required variants done, `files_completed_at` null) then a later
files-complete event. Prefer this over polling `GET /v1/track/{track_id}`.
Key on `track_id` + `status`.

## Track Files (`track_file.created` / `track_file.failed`)

One event per track file (a variant applied to a track) — easier than scanning a
whole `files[]` array. Each payload carries `status` (`success` / `failed`) and a
`file` object with `is_success` and the nested `variant`. On failure, `file.url`
is null and the reason is in `message`. Use to unlock a per-variant asset (e.g. a
lossless download) the moment it lands. Key on `file_id` (or `track_id` +
`file.variant.index`).

## Collection Sync (`collection.created` / `collection.updated` / `collection.deleted`)

Keep a local mirror of your collections. Upsert on create/update; on delete,
remove your copy (AudioDN removes the collection's tracks and files with it). Key
on `collection_id` and the collection's `updated_at` rather than arrival order.

## Handler shape

```js
app.post('/webhooks/audiodn', (req, res) => {
  res.sendStatus(200) // acknowledge fast, then process async
  const { event } = req.body
  // branch on event / status; upsert or unlock by ID; stay idempotent
})
```

Canonical: https://audiodeliverynetwork.com/docs/webhooks/track-processing/,
https://audiodeliverynetwork.com/docs/webhooks/track-files/,
https://audiodeliverynetwork.com/docs/webhooks/collection-sync/
Cross-check via MCP `adn_get_guide` topic `webhooks`.
