import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { installFormats, uninstallFormats } from '../src/core/install.js';
import { mkTmp } from './helpers.js';

const V = '0.1.0';

describe('installFormats', () => {
  it('creates all five formats in a clean repo', () => {
    const cwd = mkTmp();
    const entries = installFormats({ cwd, version: V, formats: ['agents', 'claude', 'copilot', 'cursor', 'skill'] });
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(cwd, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(cwd, '.github/copilot-instructions.md'))).toBe(true);
    expect(existsSync(join(cwd, '.cursor/rules/audiodn.mdc'))).toBe(true);
    expect(existsSync(join(cwd, '.agents/skills/audiodn/SKILL.md'))).toBe(true);
    expect(entries.every((e) => e.action === 'create')).toBe(true);
  });

  it('preserves user content in AGENTS.md (append)', () => {
    const cwd = mkTmp();
    writeFileSync(join(cwd, 'AGENTS.md'), '# House rules\n\nAlways run tests.\n');
    const entries = installFormats({ cwd, version: V, formats: ['agents'] });
    const content = readFileSync(join(cwd, 'AGENTS.md'), 'utf8');
    expect(content).toContain('House rules');
    expect(content).toContain('AUDIODN:BEGIN');
    expect(entries[0].action).toBe('append');
  });

  it('writes .audiodn.new for an unmanaged cursor rule instead of clobbering', () => {
    const cwd = mkTmp();
    const target = join(cwd, '.cursor/rules/audiodn.mdc');
    mkdirSync(join(cwd, '.cursor/rules'), { recursive: true });
    writeFileSync(target, '---\nmine: true\n---\nhand written\n');
    const entries = installFormats({ cwd, version: V, formats: ['cursor'] });
    expect(entries[0].action).toBe('conflict');
    expect(existsSync(`${target}.audiodn.new`)).toBe(true);
    expect(readFileSync(target, 'utf8')).toContain('hand written');
  });

  it('cursor .mdc has frontmatter outside the managed block', () => {
    const cwd = mkTmp();
    installFormats({ cwd, version: V, formats: ['cursor'] });
    const mdc = readFileSync(join(cwd, '.cursor/rules/audiodn.mdc'), 'utf8');
    expect(mdc.startsWith('---')).toBe(true);
    expect(mdc).toContain('alwaysApply: false');
    expect(mdc.indexOf('---')).toBeLessThan(mdc.indexOf('AUDIODN:BEGIN'));
  });

  it('dry-run writes nothing', () => {
    const cwd = mkTmp();
    installFormats({ cwd, version: V, formats: ['agents', 'skill'], dryRun: true });
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(cwd, '.agents/skills/audiodn/SKILL.md'))).toBe(false);
  });
});

describe('uninstallFormats', () => {
  it('removes managed content but keeps user text', () => {
    const cwd = mkTmp();
    writeFileSync(join(cwd, 'AGENTS.md'), '# Keep me\n');
    installFormats({ cwd, version: V, formats: ['agents', 'skill'] });
    uninstallFormats({ cwd, formats: ['agents', 'skill'] });
    expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).toContain('Keep me');
    expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).not.toContain('AUDIODN:BEGIN');
    expect(existsSync(join(cwd, '.agents/skills/audiodn/SKILL.md'))).toBe(false);
  });
});
