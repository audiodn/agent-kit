# Troubleshooting

## Common agent mistakes

| Symptom | Fix |
|---------|-----|
| No `upload_url` after session create | Call `POST /v1/upload/{upload_session_id}/track` per file |
| 401 on upload track create | Do not send Bearer; the session ID is the credential |
| Upload PUT fails later | URL expired — create a new track in the session |
| Player silent after upload | Wait for `track_status_id === 'ready'` (or usable incomplete) |
| Client bundle contains Bearer | Move API Access usage to the server |
| `/v1/` on marketing host | Use `https://api.audiodelivery.net` |
| Invented endpoint | Check OpenAPI before generating unfamiliar calls |
| Component has both `api-key` and a session id | Pick one path per component: Client-Side `api-key` (Web) or `play-session-id`/`upload-session-id` (Hybrid) |
| Signed URL passed to `<audiodn-player>` | Player takes only a client key or `play-session-id`; use native `<audio>` for signed delivery |
| “Normalize loudness” request | Decline; offer format standardization via variants instead |

## Security reminders

- Do not log Authorization headers or API keys.
- Do not silently enable destructive deletes (`ADN_MCP_ALLOW_DELETE` is local/gated).
- Prefer env vars / platform secret stores for all secrets.

## Validator

```bash
node skills/audiodn/scripts/validate-audiodn-project.mjs .
```

Configure ignores with `.audiodn-validate.json` or `audiodn-validate-ignore` on a line.

## MCP

- Hosted: `https://mcp.audiodelivery.net/mcp` — knowledge tools without a key; live API tools with `Authorization: Bearer adn_...`
- Local: `npx -y @audiodn/mcp` with `ADN_API_KEY`
- Registry: `net.audiodelivery/mcp`
