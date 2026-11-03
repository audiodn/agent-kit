#!/usr/bin/env node
/**
 * Copy the ai-plugin audiodn skill into assets/skill so agent-kit installs one
 * product voice. Adds a validate.mjs shim that re-exports the plugin validator
 * (keeps `npx @audiodn/agent-kit validate` and smoke paths working).
 *
 * Usage: node scripts/sync-from-plugin.mjs
 * Env: ADN_PLUGIN_SKILL — override source dir (default ../ai-plugin/src/skills/audiodn)
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(ROOT, 'assets', 'skill');
const SRC =
  process.env.ADN_PLUGIN_SKILL ||
  join(ROOT, '..', 'ai-plugin', 'src', 'skills', 'audiodn');

if (!existsSync(join(SRC, 'SKILL.md'))) {
  console.error(`sync-from-plugin: missing skill at ${SRC}`);
  process.exit(1);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
cpSync(SRC, DEST, { recursive: true });

const shim = `#!/usr/bin/env node
/**
 * Compatibility shim: agent-kit historically shipped validate.mjs.
 * The product validator lives in validate-audiodn-project.mjs (from ai-plugin).
 */
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(join(here, 'validate-audiodn-project.mjs')).href);

export const runValidation = mod.runValidation;
export const printFindings = mod.printFindings;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] || '.';
  const result = runValidation(root, {});
  printFindings(result);
  process.exit(result.errorCount > 0 ? 1 : 0);
}
`;

writeFileSync(join(DEST, 'scripts', 'validate.mjs'), shim);
console.log(`sync-from-plugin: copied ${SRC} -> ${DEST}`);
console.log('sync-from-plugin: wrote scripts/validate.mjs shim');
