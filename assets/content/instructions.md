# AudioDN integration guide for coding agents

This project uses (or integrates with) **AudioDN** (Audio Delivery Network).
AudioDN handles audio **upload, processing, format standardization via
variants, previews, waveforms, secure delivery, and playback**. It does **not**
perform LUFS loudness normalization or gain mastering. Follow this guidance
whenever you write or review code that touches AudioDN.

The durable Skill payload under `.agents/skills/audiodn/` (synced from the
AudioDN ai-plugin) is the detailed source of truth. Prefer it over inventing
API shapes.

## Golden rules

1. **Never put API Access credentials in browser or mobile code.** API Access
   keys (Bearer tokens) belong only on a server you control or in the host
   plugin/MCP config. Scoped Client-Side Player/Uploader keys may be used
   in-client for their documented scopes (web components **or** custom clients
   calling session routes).
2. **Never invent endpoints, fields, or parameters.** Verify every operation
   against the canonical OpenAPI document:
   `https://audiodeliverynetwork.com/openapi.json`. Poll live
   `track.track_status_id` — not obsolete `status` aliases such as
   `initializing` / `failed`.
3. **Creating an upload session is not the whole upload flow.** Create one
   session, then each track needs a **separate** request that returns that
   track's own `track_upload.upload_url`.
4. **Playback must account for processing readiness.** A freshly uploaded track
   is not immediately playable.
5. **Preserve existing API compatibility.** Do not change request/response
   shapes, rename endpoints, or drop backward-compatible behavior.
6. **Use the correct hosts.** API base is `https://api.audiodelivery.net/v1/`.
   The marketing/docs host `audiodeliverynetwork.com` must never be used as the
   API origin for `/v1/` requests.

{{PARTIALS}}

## MCP server (optional)

If your assistant speaks the Model Context Protocol, you can call AudioDN through
its MCP server instead of writing raw HTTP. It exposes the same API operations as
tools plus offline, grounded documentation/knowledge tools. Two ways to connect:

- Hosted (remote): `https://mcp.audiodelivery.net/mcp`. Knowledge/doc tools work
  with no key; live API tools activate when you send your AudioDN key as
  `Authorization: Bearer adn_...` or `X-ADN-API-Key: adn_...`. Delete tools are
  never exposed there.
- Local (stdio): `npx @audiodn/mcp` with `ADN_API_KEY` set to a server-side key.

This does not replace the rules above — API Access keys still stay server-side,
and the same canonical OpenAPI remains the source of truth.

## Canonical references

- OpenAPI 3.1 spec: https://audiodeliverynetwork.com/openapi.json
- LLM-readable overview: https://audiodeliverynetwork.com/llms-full.txt
- Docs: https://audiodeliverynetwork.com/docs
- AI-agent guide: https://audiodeliverynetwork.com/for-ai-agents
- MCP server: https://www.npmjs.com/package/@audiodn/mcp
- Cursor / Claude / Codex plugin: https://www.npmjs.com/package/@audiodn/ai-plugin

## Validate your work

If this repo has the AudioDN Skill installed, run its validator before finishing:

```bash
node .agents/skills/audiodn/scripts/validate-audiodn-project.mjs .
# or the compatibility shim:
node .agents/skills/audiodn/scripts/validate.mjs .
```

Or, with the kit:

```bash
npx @audiodn/agent-kit validate .
```
