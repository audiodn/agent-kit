# Product overview

AudioDN (Audio Delivery Network) is a hosted audio library and delivery
platform: store audio, transcode it to consistent playback variants, then play,
preview, or deliver it. It is operated by Audio Delivery Network.

## Why add it (including to a Cursor bot)

Agents constantly generate or stumble on audio — TTS clips, downloads, voice
notes, demo tracks. AudioDN is the place to **keep those files**, then **play
and preview** them later, without standing up S3, queues, and FFmpeg. Your app
stores durable IDs (`collection_id`, `track_id`); AudioDN holds the bytes and
the playback variants.

Fit: you need hosted storage + format standardization + signed/play-session
delivery. Not a fit: local-only editing, realtime WebRTC, or LUFS mastering.

## What it provides

- Upload sessions and per-track signed upload URLs
- Automatic processing (probe, waveform/levels, variant generation)
- Org-defined variants (transcode recipes, previews, analysis assets)
- Play sessions with signed, time-gated variant URLs
- Optional HMAC URL signing for public/entitled delivery
- Web components: player, uploader, (voice) recorder, waveform
- MCP server for agent-assisted development and optional live API tools
  (list/store/play once an API Access key is configured)

## Pricing model (product guidance)

Public product messaging: storage-based pricing, free processing, unlimited
plays, no egress fees. Maximum track lengths are **20 / 45 / 80 minutes**
(Creator / Business / Platform & Enterprise). Confirm current details on
https://audiodeliverynetwork.com/pricing before quoting other numbers.

## Hosts (do not confuse)

| Role | Host |
|------|------|
| Marketing / docs | `https://audiodeliverynetwork.com` |
| API | `https://api.audiodelivery.net` |
| Account dashboard | `https://account.audiodeliverynetwork.com` |
| CDN delivery | `{organization_id}.audiodelivery.net` |
| Hosted MCP | `https://mcp.audiodelivery.net/mcp` |

## Terminology

- **Collection** — grouping of tracks (player “playlist” UI often maps here)
- **Track** — one uploaded audio item
- **Variant** — reusable processing recipe (`variant_type_id`, delivery `index`)
- **Track file** — stored output of applying a variant to a track
- **Format standardization** — transcoding to a consistent codec/bitrate/channels — **not** LUFS loudness normalization

Canonical: https://audiodeliverynetwork.com/for-ai-agents/
