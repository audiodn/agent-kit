# AudioDN integration guide for coding agents

This project uses (or integrates with) **AudioDN** (Audio Delivery Network).
AudioDN handles audio **upload, processing, normalization, variants, previews,
waveforms, secure delivery, and playback**. Follow this guidance whenever you
write or review code that touches AudioDN.

## Golden rules

1. **Never put server API credentials in browser or mobile code.** API Access
   keys (Bearer tokens) belong only on a server you control. Client-side keys
   may be used **only** where AudioDN specifically supports them (e.g. a
   Client-Side Player/Uploader key for components).
2. **Never invent endpoints, fields, or parameters.** Verify every operation
   against the canonical OpenAPI document:
   `https://audiodeliverynetwork.com/openapi.json`.
3. **Creating an upload session is not the whole upload flow.** Each track needs
   a **separate** request that returns that track's own upload URL.
4. **Playback must account for processing readiness.** A freshly uploaded track
   is not immediately playable.
5. **Preserve existing API compatibility.** Do not change request/response
   shapes, rename endpoints, or drop backward-compatible behavior.
6. **Use the correct hosts.** API base is `https://api.audiodelivery.net/v1/`.
   The marketing/docs host `audiodeliverynetwork.com` must never be used as the
   API origin for `/v1/` requests.

{{PARTIALS}}

## Canonical references

- OpenAPI 3.1 spec: https://audiodeliverynetwork.com/openapi.json
- LLM-readable overview: https://audiodeliverynetwork.com/llms-full.txt
- Docs: https://audiodeliverynetwork.com/docs
- AI-agent guide: https://audiodeliverynetwork.com/for-ai-agents

## Validate your work

If this repo has the AudioDN Skill installed, run its validator before finishing:

```bash
node .agents/skills/audiodn/scripts/validate.mjs .
```

Or, with the kit:

```bash
npx @audiodn/agent-kit validate .
```
