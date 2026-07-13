# Template: Node server (ingest + play session)

Pure server-side ingest and playback provisioning. The Bearer key never leaves
this process.

```js
// ingest.mjs
const API = 'https://api.audiodelivery.net/v1';
const auth = { Authorization: `Bearer ${process.env.ADN_API_KEY}`, 'Content-Type': 'application/json' };

export async function ingest(bytes, fileName) {
  // 1. session
  const session = await fetch(`${API}/upload_session`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ collection_id: process.env.ADN_COLLECTION_ID }),
  }).then(r => r.json());

  // 2. per-track (no Bearer)
  const { track_id, track_upload } = await fetch(`${API}/upload/${session.upload_session_id}/track`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: fileName }),
  }).then(r => r.json());

  // 3. PUT bytes
  await fetch(track_upload.upload_url, { method: track_upload.method, body: bytes });

  // 4. wait for readiness (prefer the Track Processing webhook in production)
  let status;
  do {
    await new Promise(r => setTimeout(r, 5000));
    const t = await fetch(`${API}/track/${track_id}`, { headers: { Authorization: auth.Authorization } }).then(r => r.json());
    status = t.track?.track_status_id;
  } while (!['ready', 'incomplete', 'error'].includes(status));

  return { track_id, status };
}

export async function playSession(track_id) {
  return fetch(`${API}/play_session/track`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ track_id, variants: ['hq'], expires_in: 3600 }),
  }).then(r => r.json());
}
```
