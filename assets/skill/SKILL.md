---
name: audiodn
description: Use when integrating AudioDN (Audio Delivery Network) — audio upload, processing, variants/previews, waveforms, secure delivery, and playback. Covers auth boundaries, the multi-step upload flow, processing readiness, playback, webhooks, and security, plus a validator for common mistakes.
---

# AudioDN integration skill

Use this skill whenever you write or review code that uploads, processes,
delivers, or plays audio through AudioDN. Read the relevant reference before
implementing, and run the validator before you finish.

## Non-negotiable rules

1. Server API credentials (Bearer / API Access keys) never appear in browser or
   mobile code. Client-side keys only where AudioDN supports them.
2. Never invent endpoints, fields, or params. Verify against the canonical
   OpenAPI: https://audiodeliverynetwork.com/openapi.json
3. Creating an upload session is not the whole upload. Each track needs a
   separate request that returns its own `track_upload.upload_url`.
4. Playback must wait for processing readiness.
5. Preserve existing API compatibility (paths use underscores; no shape changes).
6. API host is `https://api.audiodelivery.net/v1/`; never use the marketing host
   `audiodeliverynetwork.com` for `/v1/` calls.

## References (read as needed)

- `references/authentication.md` — key types and which endpoints are session-gated.
- `references/upload-flow.md` — session -> per-track -> PUT -> readiness.
- `references/processing.md` — statuses and readiness detection.
- `references/playback.md` — play sessions and signed delivery.
- `references/webhooks.md` — track/file/collection webhooks.
- `references/security.md` — secret handling and the validator's rules.

MCP-capable assistants can also call AudioDN via its MCP server instead of raw
HTTP - hosted at `https://mcp.audiodelivery.net/mcp` (bring-your-own-key header)
or local via `npx @audiodn/mcp` - which exposes the API plus grounded doc tools.
The same non-negotiable rules apply (server keys stay server-side; verify against
the canonical OpenAPI).

## Framework templates

Copy-adapt the correct server/client boundary for your stack:

- `templates/nextjs.md`
- `templates/vue-nuxt.md`
- `templates/cloudflare-worker.md`
- `templates/node-server.md`

## Validate before finishing

```bash
node .agents/skills/audiodn/scripts/validate.mjs .
```

Fix every error (exit code is non-zero while errors remain) and review warnings.
The validator checks: server key in client code, invented endpoints, missing
per-track request, permanent upload URL, playback before ready, hardcoded
secrets, incorrect API origin, and obsolete documentation URLs.
