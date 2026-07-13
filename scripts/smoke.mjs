#!/usr/bin/env node
// End-to-end smoke test: build, init into a temp repo, verify idempotency,
// and confirm the validator flags a broken integration. Offline.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(ROOT, 'dist', 'cli.js');

function run(args, cwd = ROOT) {
  return execFileSync('node', args, { cwd, encoding: 'utf8' });
}

function assert(cond, msg) {
  if (!cond) {
    console.error(`SMOKE FAIL: ${msg}`);
    process.exit(1);
  }
}

console.log('1/5 building...');
execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
assert(existsSync(CLI), 'dist/cli.js exists after build');

const tmp = mkdtempSync(join(tmpdir(), 'adn-agent-kit-smoke-'));
try {
  console.log(`2/5 init --yes into ${tmp}`);
  run([CLI, 'init', '--yes', '--cwd', tmp]);
  for (const f of [
    'AGENTS.md',
    'CLAUDE.md',
    '.github/copilot-instructions.md',
    '.cursor/rules/audiodn.mdc',
    '.agents/skills/audiodn/SKILL.md',
    '.agents/skills/audiodn/scripts/validate.mjs',
  ]) {
    assert(existsSync(join(tmp, f)), `installed ${f}`);
  }

  console.log('3/5 re-run must be idempotent (all unchanged)');
  const second = run([CLI, 'init', '--yes', '--cwd', tmp]);
  assert(!/\+ created/.test(second), 'no new creations on second run');
  assert(/= unchanged/.test(second), 'reports unchanged on second run');

  console.log('4/5 validator flags a broken project');
  const bad = join(tmp, 'bad');
  mkdirSync(bad, { recursive: true });
  writeFileSync(
    join(bad, 'app.js'),
    [
      "const key = 'adn_api_abcdef123456';",
      "fetch('https://audiodeliverynetwork.com/v1/tracks', { headers: { Authorization: `Bearer ${key}` } });",
    ].join('\n'),
  );
  let failed = false;
  try {
    execFileSync('node', [join(tmp, '.agents/skills/audiodn/scripts/validate.mjs'), bad], { encoding: 'utf8' });
  } catch {
    failed = true;
  }
  assert(failed, 'validator exits non-zero on a broken project');

  console.log('5/5 uninstall removes managed content');
  run([CLI, 'uninstall', '--cwd', tmp]);
  assert(!existsSync(join(tmp, '.agents/skills/audiodn/SKILL.md')), 'skill removed after uninstall');

  console.log('SMOKE PASS');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
