# Template: Cloudflare Worker signed playback

Sign delivery URLs at the edge. The signing secret lives in a Worker secret
(`wrangler secret put ADN_SIGNING_SECRET`) and never reaches the client.

```js
// src/index.mjs
function base64url(bytes) {
  let s = '';
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function signUrl(secret, domain, path) {
  const u = new URL('https://' + domain + '/' + path);
  u.searchParams.delete('verify');
  const issued = Math.floor(Date.now() / 1000).toString();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key,
    new TextEncoder().encode(u.pathname + (u.search || '') + issued)));
  u.searchParams.append('verify', issued + '-' + base64url(mac)); // verify LAST
  return u.toString();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.searchParams.get('path');
    if (!path) return new Response('path required', { status: 400 });
    // TODO: check entitlement here before signing.
    const signed = await signUrl(env.ADN_SIGNING_SECRET, env.ADN_DELIVERY_DOMAIN, path);
    return Response.json({ url: signed });
  },
};
```

Secret in `wrangler.toml`? No — only public `[vars]` (e.g. `ADN_DELIVERY_DOMAIN`).
See the runnable example `examples/cloudflare-worker-signed-playback`.
