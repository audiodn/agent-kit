import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSETS_DIR } from '../src/paths.js';
import { buildGuidanceBody } from '../src/core/render.js';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

// A literal AudioDN key/secret would look like adn_<kind>_<random> or a Bearer
// followed by such a literal. Env-var names and ${process.env.X} are fine.
const SECRET_LITERAL = /adn_[a-z]+_[A-Za-z0-9]{6,}/;
const BEARER_LITERAL = /Bearer\s+adn_[A-Za-z0-9_]{6,}/i;

describe('no hardcoded secrets in shipped assets', () => {
  const files = walk(ASSETS_DIR).filter((f) => !f.endsWith('openapi.json') && !f.endsWith('llms-full.txt'));

  it.each(files.map((f) => [f]))('%s has no secret literal', (file) => {
    const content = readFileSync(file, 'utf8');
    expect(SECRET_LITERAL.test(content), `${file} contains a key-like literal`).toBe(false);
    expect(BEARER_LITERAL.test(content), `${file} contains a Bearer literal`).toBe(false);
  });

  it('rendered guidance body has no secret literal', () => {
    const body = buildGuidanceBody();
    expect(SECRET_LITERAL.test(body)).toBe(false);
    expect(BEARER_LITERAL.test(body)).toBe(false);
  });
});
