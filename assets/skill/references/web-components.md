# Web components

Package: `@audiodn/components`
CDN example: `unpkg.com/@audiodn/components@latest/dist/{player,uploader,recorder,waveform}.js`

Every component takes **one** of two credential inputs — set exactly one, never
both, and never an API Access key.

- **`api-key`** — a scoped Client-Side Player/Uploader key. Minted in the
  dashboard or via `POST /v1/api_key` (see `references/authentication.md`).
  Long-lived (or `expires_at`-bounded), scoped by collection/track/creator/
  variants; the component creates its own sessions and self-serves all API calls,
  no backend.
- **`play-session-id` / `upload-session-id`** — the server mints the session with
  an API Access key (applying entitlement checks) and passes only the session ID.
  Short-lived, per-listener / per-upload; the client holds no key.

Both inputs drive nearly identical API calls; only the credential differs. See
`references/choosing-an-integration.md` for how each maps to an upload/playback
terminal.

## `<audiodn-player>`

Key attributes:

- `api-key` **or** `play-session-id` (never both; never a server API Access key)
- `scope` — `track` | `collection`
- `id` — track or collection id matching scope
- `variants` — delivery index(es) in priority order, e.g. `hq,lq` (first is default)
- `size` — `small` | `regular` | `large` (default `large`; applies to the `default` layout)
- `variant` — layout: `default` (full player) | `inline` (compact play/pause button with a clockwise progress ring + settings menu; shows no track info — surface it yourself). `height` sizes the inline button.
- `theme` — `auto` | `dark` | `light`
- `volume`, `autoplay`, `downloadable` (request only; the key/session must allow downloads)
- `session-ttl`
- Waveform-related attrs forwarded to the waveform component

## `<audiodn-uploader>`

- `api-key` **or** `upload-session-id` (never both)
- `collection-id` — omit when the key/session is already collection-scoped
- `accent-color`, `theme`, `disabled`, `limit`
- Event `file-uploaded` ⇒ bytes stored, **not** processing complete

## `<audiodn-recorder>`

In-browser voice capture that uploads a **single** track — the microphone
counterpart to the uploader.

- `api-key` **or** `upload-session-id` (never both; never an API Access key)
- `collection-id` — omit when the key/session is already collection-scoped
- With `api-key`, it creates the upload session **and** the track in one request,
  then PUTs the recording (the single-file nested-`track` convenience).
- Filenames are generated from the UTC timestamp; the browser picks a supported
  mime type (Opus in WebM/Ogg, else MP4/AAC on Safari).
- `variant` (`panel` default / `inline`), `accent-color`, `theme`, `locale`,
  `countdown`, `max-duration`, `height` (inline), `auto-hide`, `disabled`
- Events: `recording-started`, `recording-stopped` (`{ blob, duration }`),
  `recording-discarded`, `upload-progress` (`{ percent }`),
  `file-uploaded` (`{ trackId, fileName, blob }` ⇒ bytes stored, **not** ready),
  `session-error`, `adn-session-refreshed`, `adn-session-expired`.
- On `file-uploaded`, relay `trackId` (and, for later signed delivery, the stored
  `track.base_url`) to your server; then gate playback on processing readiness.

## `<audiodn-waveform>`

- JS property `levels`
- `variant` — `vertical` | `wavy` | `reflection`
- `height`, `line-width`, `line-color`, `gap`, `scale-strength`, `progress`, `duration`

Theming uses `--adn-*` CSS custom properties.

Canonical: https://audiodeliverynetwork.com/docs/components/player (and uploader / recorder / waveform pages).
