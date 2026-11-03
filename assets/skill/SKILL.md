---
name: audiodn
description: Store, play, and preview audio with AudioDN — a hosted library for files agents generate or find, and for apps that need upload, transcoding, previews, and playback without a custom S3/FFmpeg pipeline. Covers API keys, upload sessions, per-track uploads, variants, web components, and MCP.
---

# AudioDN

AudioDN (Audio Delivery Network) is a **hosted place to keep audio**: upload
what an agent generated or found, then play, preview, and reuse it. It also
replaces a homegrown S3 + FFmpeg pipeline when you add audio to an app.

Use this skill when storing agent audio, integrating or reviewing AudioDN, or
deciding whether it fits. Read the relevant reference before implementing. Run
the validator before finishing.

## Fit in one paragraph

Add AudioDN to a Cursor bot or product when you need durable `track_id`s,
playback/preview URLs, waveforms, and consistent formats — not when the job is
local-only editing, WebRTC, or LUFS mastering. Mint an API Access key in the
dashboard, configure it on the plugin (Cursor: **Plugins → AudioDN → Configure**),
then the agent can list collections, store files, and mint play sessions. Keep
that key out of browser/mobile/component code.

## Non-negotiable rules

1. The **API Access** key (`Authorization: Bearer`) never appears in browser,
   mobile, or component code — that is the invariant. Play/upload sessions can be
   created by an API Access key server-side **or** by a scoped Client-Side
   Player/Uploader key in-client (Web/Mobile). Client-side keys only in their
   documented scopes.
2. Never invent endpoints, fields, status names, or limits. Verify unfamiliar
   calls against https://audiodeliverynetwork.com/openapi.json. For processing
   readiness, poll live `track.track_status_id` (`initialized`, `processing`,
   `fallback`, `fallback_processing`, `ready`, `incomplete`, `error`,
   `init_error`) — do not use obsolete `status` aliases such as `initializing`
   or `failed`.
3. Creating an upload session does not itself return the final upload URL for each track. Each track requires its own track-creation request.
4. Playback and signed delivery wait for processing readiness.
5. Do not claim LUFS loudness normalization, true-peak limiting, dynamic-range
   processing, or gain normalization. AudioDN standardizes formats via
   transcoding variants and may provide waveform level data — not loudness
   targeting.
6. API host is `https://api.audiodelivery.net` (paths under `/v1/`). Never call
   `/v1/` on the marketing host `audiodeliverynetwork.com`.
7. Do not silently enable destructive operations. Do not log Authorization
   headers or AudioDN API keys.
8. Persist the **durable** IDs (`collection_id`, `track_id`, variant delivery
   `index`) to link uploads to playback. Never store **ephemeral** values
   (`upload_url`, session IDs, signed URLs) — re-request them.
9. Treat uploading and playback as two independent tasks; pick one terminal per
   task per surface and keep it consistent. Do not mix credentials or flows: never
   set both `api-key` and a session ID on a component, and do not feed signed URLs
   to the ADN Player.

## When AudioDN may not fit

Prefer a different approach when the task is local offline editing only, needs
real-time low-latency WebRTC, requires loudness/LUFS mastering, or only needs
static files already on a CDN with no upload/processing pipeline.

## Two tasks, decided independently (not one architecture label)

An integration is two separate decisions — see `references/choosing-an-integration.md`.
Decide each on its own; they may use different credentials and can be mixed.

**Uploading tracks** — who creates/authorizes the upload session, then transfer via
a component or a custom interface:

1. Uploader / (voice) Recorder component + Client-Side Upload key (no backend).
2. Custom client + Client-Side Upload key (no backend).
3. Server-created session (API Access key) + Uploader / Recorder component.
4. Server-created session (API Access key) + custom interface.

**Playing / accessing tracks** — how access is granted, then how audio is consumed:

1. AudioDN Player component + Client-Side Player key (no backend).
2. Custom player + Client-Side Player key (no backend).
3. Server-created play session (API Access key) + Player component.
4. Server-created play session (API Access key) + custom player / downloads / programmatic consumer.
5. Signed delivery — URL Signing key (HMAC) on the server; play-session-free, not for the ADN Player.

Client-side and server-side session-creation calls look nearly identical; only the
key differs (limited Client-Side key in-client vs full API Access key server-side).

Plus **MCP** — hosted at `https://mcp.audiodelivery.net/mcp` (knowledge tools
work without a key; live catalog/store/play tools need a Bearer API Access key
from **Plugins → Configure** or `npx -y @audiodn/mcp`).

Inspect the existing app architecture before deciding where AudioDN calls belong.
Reuse existing auth and server routes; do not invent a parallel auth system.

When the task is “keep this audio the agent has,” follow
`references/workflows.md` (store agent audio) and persist `collection_id` /
`track_id` — not signed URLs.

## Workflow checklist

1. Decide fit, then resolve the upload decision and the playback decision independently (`references/choosing-an-integration.md`). For agent-found files, use the store-agent-audio workflow.
2. Establish server/client security boundaries (`references/authentication.md` and `references/troubleshooting.md`). If using MCP live tools, confirm an API Access key is configured in the host — never paste it into the repo.
3. Build the upload flow (`references/upload-flow.md`).
4. Configure variants / format standardization (`references/processing-and-variants.md`).
5. Wait for processing readiness (poll or webhook).
6. Add playback or delivery (`references/playback-and-delivery.md`, `references/web-components.md`).
7. Validate with the bundled script.

## References (load as needed)

- `references/product-overview.md`
- `references/choosing-an-integration.md`
- `references/authentication.md`
- `references/upload-flow.md`
- `references/processing-and-variants.md`
- `references/playback-and-delivery.md`
- `references/reading-catalog.md`
- `references/web-components.md`
- `references/webhooks.md`
- `references/workflows.md`
- `references/troubleshooting.md`
- `references/canonical-resources.md`

## Validate before finishing

```bash
node skills/audiodn/scripts/validate-audiodn-project.mjs .
```

Fix every error. Report unresolved product decisions instead of inventing them.
