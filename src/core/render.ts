import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT_DIR } from '../paths.js';

const PARTIAL_ORDER = [
  'auth',
  'upload',
  'processing',
  'playback',
  'webhooks',
  'security',
  'compatibility',
];

/**
 * Build the canonical guidance body shared by all block-format outputs. Single
 * source of truth: assets/content/instructions.md with {{PARTIALS}} expanded.
 */
export function buildGuidanceBody(): string {
  const instructions = readFileSync(join(CONTENT_DIR, 'instructions.md'), 'utf8');
  const partials = PARTIAL_ORDER.map((name) =>
    readFileSync(join(CONTENT_DIR, 'partials', `${name}.md`), 'utf8').trim(),
  ).join('\n\n');
  return instructions.replace('{{PARTIALS}}', partials).trim();
}
