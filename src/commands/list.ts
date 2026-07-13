import { join } from 'node:path';
import { FORMATS } from '../core/formats.js';
import { readIfExists } from '../core/fsutil.js';
import { SNAPSHOTS_DIR } from '../paths.js';
import { getVersion } from '../version.js';

export function runList(): number {
  console.log(`@audiodn/agent-kit v${getVersion()}`);

  console.log('\nFormats:');
  for (const f of FORMATS) {
    const target = f.kind === 'skill' ? `${f.target}/` : f.target;
    console.log(`  ${f.id.padEnd(8)} -> ${target}  (${f.label})`);
  }

  const raw = readIfExists(join(SNAPSHOTS_DIR, 'sources.json'));
  if (raw) {
    try {
      const s = JSON.parse(raw) as {
        openapiVersion?: string;
        sources?: Array<{ name: string; url: string; fetchedAt?: string }>;
      };
      console.log('\nBundled canonical snapshots:');
      console.log(`  OpenAPI version: ${s.openapiVersion ?? 'unknown'}`);
      for (const src of s.sources ?? []) {
        console.log(`  - ${src.name} (${src.url}) fetched ${src.fetchedAt ?? 'unknown'}`);
      }
    } catch {
      /* ignore malformed snapshot manifest */
    }
  }

  return 0;
}
