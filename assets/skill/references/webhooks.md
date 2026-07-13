# Webhook reference

Configure webhooks in the dashboard to react to processing without polling.

- **Track Processing** (`webhook_url`): fires when a track reaches a terminal
  status (`ready`, `incomplete`, `error`, `init_error`) or when its file set is
  complete (`files_completed_at`) — not on transitional statuses.
- **Track File** (`webhook_url_file`): fires once per track file with a status of
  `success`/`failed` (`track_file.created` / `track_file.failed`).
- **Collection Sync**: collection create/update/delete events.

## Handler rules

- Make handlers idempotent — deliveries can retry.
- Verify authenticity before trusting the payload.
- Use the terminal event to advance your own workflow (mark ready, notify user).

Canonical: https://audiodeliverynetwork.com/docs/webhooks/track-processing,
`/docs/webhooks/track-files`, `/docs/webhooks/collection-sync`.
