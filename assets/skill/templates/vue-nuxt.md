# Template: Vue / Nuxt secure upload

Nuxt server routes hold the Bearer key; the Vue component does the per-track
create, the PUT, and polls the status proxy.

```ts
// server/api/upload-session.post.ts  (SERVER)
export default defineEventHandler(async () => {
  const res = await $fetch('https://api.audiodelivery.net/v1/upload_session', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.ADN_API_KEY}`, 'Content-Type': 'application/json' },
    body: { collection_id: process.env.ADN_COLLECTION_ID },
  });
  return { upload_session_id: res.upload_session_id };
});
```

```ts
// server/api/track-status.get.ts  (SERVER)
export default defineEventHandler(async (event) => {
  const { trackId } = getQuery(event);
  const res = await $fetch(`https://api.audiodelivery.net/v1/track/${trackId}`, {
    headers: { Authorization: `Bearer ${process.env.ADN_API_KEY}` },
  });
  return { status: res.track?.track_status_id };
});
```

```vue
<!-- component (client) — NO api key -->
<script setup lang="ts">
async function upload(file: File) {
  const { upload_session_id } = await $fetch('/api/upload-session', { method: 'POST' });
  const { track_id, track_upload } = await $fetch(
    `https://api.audiodelivery.net/v1/upload/${upload_session_id}/track`,
    { method: 'POST', body: { file_name: file.name } },
  );
  await fetch(track_upload.upload_url, { method: track_upload.method, body: file });
  let status: string | undefined;
  do {
    await new Promise(r => setTimeout(r, 3000));
    status = (await $fetch('/api/track-status', { query: { trackId: track_id } })).status;
  } while (status && !['ready', 'incomplete', 'error'].includes(status));
}
</script>
```

Register `<audiodn-*>` as custom elements in `nuxt.config.ts`.
See the AudioDN docs recipe `/docs/recipes/vue-secure-upload`.
