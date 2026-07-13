# Template: Next.js (App Router) secure upload

Server route mints the session (Bearer stays server-side); the browser creates
the per-track URL, PUTs bytes, and polls a server proxy for readiness.

```ts
// app/api/upload-session/route.ts  (SERVER)
export const runtime = 'nodejs';
export async function POST() {
  const res = await fetch('https://api.audiodelivery.net/v1/upload_session', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.ADN_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ collection_id: process.env.ADN_COLLECTION_ID }),
  });
  const s = await res.json();
  return Response.json({ upload_session_id: s.upload_session_id }); // only the id
}
```

```ts
// app/api/track-status/route.ts  (SERVER — GET /v1/track needs the key)
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('trackId');
  const res = await fetch(`https://api.audiodelivery.net/v1/track/${id}`, {
    headers: { Authorization: `Bearer ${process.env.ADN_API_KEY}` },
  });
  const b = await res.json();
  return Response.json({ status: b.track?.track_status_id ?? null });
}
```

```ts
// client component  ('use client') — NO api key here
const { upload_session_id } = await fetch('/api/upload-session', { method: 'POST' }).then(r => r.json());
const { track_id, track_upload } = await fetch(
  `https://api.audiodelivery.net/v1/upload/${upload_session_id}/track`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ file_name: file.name }) },
).then(r => r.json());
await fetch(track_upload.upload_url, { method: track_upload.method, body: file }); // PUT
let status;
do {
  await new Promise(r => setTimeout(r, 3000));
  status = (await fetch(`/api/track-status?trackId=${track_id}`).then(r => r.json())).status;
} while (status && !['ready', 'incomplete', 'error'].includes(status));
```

See the runnable example `examples/nextjs-secure-upload` in the AudioDN repo.
