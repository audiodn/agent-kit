# Choosing an integration

Inspect the existing project framework, auth, and server routes before adding
AudioDN. Prefer extending what exists.

An AudioDN integration is **two independent tasks**, not one architecture label:

1. **Uploading tracks** — who creates/authorizes the upload session, and whether
   files move through a web component or a custom interface.
2. **Playing / accessing tracks** — how access is granted (a scoped client-side
   key, a server-created session, or a signed URL), and how audio is consumed.

Decide each task **on its own**. They may use different credentials, and a single
product can mix them (for example, signed previews plus gated full tracks). There
is no single "Web / Mobile / Hybrid / Server-side" mode to pick up front — that
older framing is retired (see the legacy map at the end).

**Cursor bot / agent library.** If the goal is “keep audio this agent generated or
found,” use an API Access key in the host (plugin Configure / MCP) to store
tracks, then a play session or player for preview. That is the same upload
sequence as any other terminal; there is no separate agent API. See
`references/workflows.md` (store agent audio).

- Docs: https://audiodeliverynetwork.com/docs/integration
- Uploading: https://audiodeliverynetwork.com/docs/integration/uploading
- Playing / accessing: https://audiodeliverynetwork.com/docs/integration/playback

## The mental model (read before choosing)

- **Client-side keys are client-safe and split by purpose.** A **Client-Side
  Upload** key creates upload sessions only; a **Client-Side Player** key creates
  play sessions only (it cannot manage tracks or collections). Both can be scoped
  to a collection; the player key can also be scoped to specific tracks/variants.
  In-client, the app can create sessions with these keys **or** just drop in a web
  component that holds the key.
- **The API Access key is full-access and server-only.** Keep it in env / a
  secret store. From the server you can apply your own checks and then push either
  a **session ID** (upload or play) or a **signed URL** to the client, so the
  client holds no credentials and no logic.
- **Sessions and scope.** A session scoped to a collection uses that collection;
  otherwise pass `collection_id` (or `track_id` for play). Session IDs are
  short-lived capability tokens and are safe to hand to the client.
- **Client and server session-creation calls look nearly identical** — same
  `POST /v1/upload_session` / `POST /v1/play_session/{scope}` shape. The only
  difference is the key: a limited Client-Side key in-client vs the full API
  Access key on the server. Do not overthink "paths"; pick where the key lives.
- **Mix freely.** Everything on the API, everything in the client, or a blend —
  per task and per surface.

## Uploading tracks (pick one terminal)

Decision tree (mirrors the docs): **who creates/authorizes the session?**
`uploader-component` · `custom-client` · `server`; if `server`, **transfer via**
`component` · `custom`.

| If the project… | Use | Credential | Backend? | Deep link |
|-----------------|-----|-----------|----------|-----------|
| Wants the fastest drop-in; static site / MVP / admin tool; single-file voice capture | Uploader **or** (voice) Recorder web component | Client-Side Upload key (in component) | No | `?upload=uploader-component` |
| Builds its own upload UI (web or native) with no backend | Custom client upload | Client-Side Upload key (in app) | No | `?upload=custom-client` |
| Must gate uploads (login / quota / entitlement) but still wants a drop-in UI | Server-created session + Uploader/Recorder component | API Access key (server) → session ID to component | Yes | `?upload=server.component` |
| Must gate uploads and build a fully custom uploader | Server-created session + custom interface | API Access key (server) → session ID to client/server | Yes | `?upload=server.custom` |

Full guide (with per-platform code and native tabs):
https://audiodeliverynetwork.com/docs/integration/uploading

**Per-file lifecycle (all upload terminals).** Create **one** upload session
(`POST /v1/upload_session`), then for **each** file call
`POST /v1/upload/{upload_session_id}/track` and `PUT` the bytes to
`track_upload.upload_url`. A single-file upload (e.g. the Recorder) may include a
nested `track` on session create to get the first upload URL in the same request.
Detail: `references/upload-flow.md`.

**Client-side uploads: tell your server.** When bytes are uploaded from the
browser/app, relay success and the durable IDs (`track_id`, and the stored
`track.base_url` / `base_path`) back to your server — especially if you plan to
sign delivery URLs later. Do not persist ephemeral values (`upload_url`, session
IDs).

## Playing / accessing tracks (pick one terminal)

Decision tree (mirrors the docs): **how is access granted?**
`player-component` · `custom-client` · `server-session` · `signed-delivery`; if
`server-session`, **play via** `player` · `custom`.

| If the project… | Use | Credential | Backend? | Deep link |
|-----------------|-----|-----------|----------|-----------|
| Wants the fastest drop-in player; per-listener server approval not required | AudioDN Player web component | Client-Side Player key (in component) | No | `?playback=player-component` |
| Builds its own player/UI (web or native), no backend, no per-listener gating | Custom player | Client-Side Player key (in app) | No | `?playback=custom-client` |
| Must check entitlement per listener, then wants the drop-in player | Server-created play session + Player component | API Access key (server) → play-session-id | Yes | `?playback=server-session.player` |
| Must check entitlement per listener, custom player / downloads / programmatic consumer | Server-created play session + custom player | API Access key (server) → variant URLs | Yes | `?playback=server-session.custom` |
| Public / entitled delivery with no play-session round trip (previews, marketing, telephony) | Signed delivery (no play session) | URL Signing key (HMAC, server) | Yes | `?playback=signed-delivery` |

Full guide (with per-platform code and native tabs):
https://audiodeliverynetwork.com/docs/integration/playback

**Access is broader than "player vs custom."** Consumers include the ADN Player
component, a custom web/native player, **downloads** (session created with
`is_downloadable: true`), and **programmatic / non-visual** delivery such as
telephony or answering-machine playback. A server-created session returns signed
variant URLs your consumer can use directly.

**Signed delivery specifics.** Sign the delivery URL on your server with a URL
Signing key (HMAC-SHA256); no play session and no API round trip at play time.
Build the URL from the durable `track.base_url` (append the variant suffix and
extension, e.g. `{base_url}_128.mp3`), then append the `verify` query parameter
**last**; the signing secret never reaches the client. Deliver the signed URL to
the client directly or via a server redirect. Signed delivery is a playback
option only — not an upload method, and **not** for the ADN Player component
(which takes a client key or `play-session-id`). Every signed request still
counts toward play usage.

## Do not mix credentials or flows (per terminal)

- Never place an API Access (Bearer) key in a browser, mobile app, `public/`
  assets, or a component. Clients get a scoped Client-Side key, a session ID, or a
  signed URL.
- Never set both `api-key` and `play-session-id` / `upload-session-id` on the same
  component — choose one.
- Signed delivery is play-session-free: do not also create a play session for the
  same stream, and do not feed signed URLs to the ADN Player.

## Security boundary (always)

- API Access keys stay on the server (env / secret store).
- Browsers and mobile apps get Client-Side Player/Uploader keys (documented scopes
  only) or short-lived session IDs / signed URLs.
- Agents must not silently enable destructive delete operations.

## When AudioDN may not fit

Offline DAW editing, WebRTC real-time low-latency audio, or LUFS/loudness
mastering. AudioDN standardizes formats via transcoding variants — it does not do
loudness/LUFS mastering.

## Legacy map (retired architecture labels → today's terminals)

Older docs and links used single up-front labels. They now decode to specific
terminals; treat them only as translation aids.

| Old label | Upload terminal | Playback terminal |
|-----------|-----------------|-------------------|
| Web | `?upload=uploader-component` | `?playback=player-component` |
| Mobile | `?upload=custom-client` (native platform) | `?playback=custom-client` (native platform) |
| Server-side | `?upload=server.custom` | `?playback=server-session.custom` |
| Hybrid | `?upload=server.component` | `?playback=server-session.player` |
| Signed delivery | (upload uses any terminal) | `?playback=signed-delivery` |

"Mobile" is not a path — it is a platform (`browser` / `ios` / `android` /
`flutter`) chosen inside the custom-interface terminals.

## Related AudioDN packages

| Package / resource | Role |
|--------------------|------|
| This plugin | Marketplace skills, workflows, MCP wiring for coding agents |
| `@audiodn/mcp` | MCP server (stdio or hosted HTTP) |
| `@audiodn/agent-kit` | Installs guidance files into a project (`AGENTS.md`, rules, skill copy) |
| `@audiodn/components` | Web components (player, uploader, recorder, waveform) |

AI tools (MCP, Agent Kit, this plugin) help implement these same two tasks — they
are not additional integration paths. Do not duplicate documentation wholesale;
link to canonical docs and OpenAPI.
