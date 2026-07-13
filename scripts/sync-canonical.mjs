#!/usr/bin/env node
// Refresh the bundled canonical documentation snapshots from the PUBLIC AudioDN
// site. One-way: agent-kit reads the public website; it never depends on the
// AudioDN monorepo. Run manually (`npm run sync`) or in the scheduled workflow.
//
// Updates:
//   assets/snapshots/openapi.json
//   assets/snapshots/llms-full.txt
//   assets/snapshots/sources.json      (urls, fetchedAt, sha256, openapiVersion)
//   assets/skill/scripts/known-endpoints.json  (regenerated from OpenAPI paths)
import { createHash } from 'node:crypto';
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAP = join(ROOT, 'assets', 'snapshots');
const KNOWN = join(ROOT, 'assets', 'skill', 'scripts', 'known-endpoints.json');

const SITE = process.env.AUDIODN_SITE || 'https://audiodeliverynetwork.com';
const TARGETS = [
  { name: 'openapi.json', url: `${SITE}/openapi.json` },
  { name: 'llms-full.txt', url: `${SITE}/llms-full.txt` },
];

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

async function fetchText(url) {
  const res = await fetch(url, { headers: { accept: '*/*' } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const sources = [];
  let openapiVersion = 'unknown';

  for (const t of TARGETS) {
    process.stdout.write(`Fetching ${t.url} ... `);
    const body = await fetchText(t.url);
    writeFileSync(join(SNAP, t.name), body);
    sources.push({ name: t.name, url: t.url, fetchedAt: today, sha256: sha256(body) });
    console.log(`ok (${body.length} bytes)`);

    if (t.name === 'openapi.json') {
      const spec = JSON.parse(body);
      openapiVersion = spec.info?.version || 'unknown';
      const paths = Object.keys(spec.paths || {}).sort();
      const known = {
        note: 'Canonical AudioDN v1 path templates. Regenerated from the public OpenAPI by scripts/sync-canonical.mjs. Used by validate.mjs to detect invented endpoints.',
        openapiVersion,
        apiBase: 'https://api.audiodelivery.net/v1',
        paths,
      };
      writeFileSync(KNOWN, `${JSON.stringify(known, null, 2)}\n`);
      console.log(`  regenerated known-endpoints.json (${paths.length} paths)`);
    }
  }

  const manifest = {
    openapiVersion,
    generatedBy: 'scripts/sync-canonical.mjs',
    sources,
  };
  writeFileSync(join(SNAP, 'sources.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log('Wrote sources.json.');

  // Guard: known-endpoints must still be valid JSON.
  JSON.parse(readFileSync(KNOWN, 'utf8'));
  console.log('Sync complete.');
}

main().catch((err) => {
  console.error(`sync-canonical failed: ${err.message}`);
  process.exit(1);
});
