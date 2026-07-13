import { rmSync } from 'node:fs';
import { join } from 'node:path';
import type { FormatId } from './formats.js';
import { FORMATS } from './formats.js';
import { readIfExists, writeFileEnsuringDir } from './fsutil.js';
import { mergeBlock, removeBlock } from './merge.js';
import { buildGuidanceBody } from './render.js';
import type { ReportEntry } from './report.js';
import { installSkill, uninstallSkill } from './skill.js';

export interface InstallOptions {
  cwd: string;
  version: string;
  formats: FormatId[];
  dryRun?: boolean;
  force?: boolean;
}

export function installFormats(opts: InstallOptions): ReportEntry[] {
  const body = buildGuidanceBody();
  const entries: ReportEntry[] = [];
  const selected = FORMATS.filter((f) => opts.formats.includes(f.id));

  for (const fmt of selected) {
    if (fmt.kind === 'skill') {
      entries.push(...installSkill(opts.cwd, opts.version, { dryRun: opts.dryRun, force: opts.force }));
      continue;
    }

    const target = join(opts.cwd, fmt.target);
    const existing = readIfExists(target);
    const result = mergeBlock(existing, opts.version, body, {
      preambleOnCreate: fmt.preambleOnCreate,
      appendIfUnmanaged: fmt.appendIfUnmanaged,
    });

    if (result.action === 'conflict') {
      const fresh = mergeBlock(null, opts.version, body, {
        preambleOnCreate: fmt.preambleOnCreate,
        appendIfUnmanaged: fmt.appendIfUnmanaged,
      }).content!;
      if (opts.force) {
        if (!opts.dryRun) writeFileEnsuringDir(target, fresh);
        entries.push({ path: fmt.target, action: 'update', note: 'forced overwrite' });
      } else {
        if (!opts.dryRun) writeFileEnsuringDir(`${target}.audiodn.new`, fresh);
        entries.push({ path: fmt.target, action: 'conflict', note: 'wrote .audiodn.new' });
      }
      continue;
    }

    if (result.content !== null && result.action !== 'unchanged' && !opts.dryRun) {
      writeFileEnsuringDir(target, result.content);
    }
    entries.push({ path: fmt.target, action: result.action });
  }

  return entries;
}

export interface UninstallOptions {
  cwd: string;
  formats: FormatId[];
  dryRun?: boolean;
}

export function uninstallFormats(opts: UninstallOptions): ReportEntry[] {
  const entries: ReportEntry[] = [];
  const selected = FORMATS.filter((f) => opts.formats.includes(f.id));

  for (const fmt of selected) {
    if (fmt.kind === 'skill') {
      entries.push(...uninstallSkill(opts.cwd, { dryRun: opts.dryRun }));
      continue;
    }

    const target = join(opts.cwd, fmt.target);
    const existing = readIfExists(target);
    if (existing === null) continue;

    const { content, changed } = removeBlock(existing);
    if (!changed) {
      entries.push({ path: fmt.target, action: 'skipped', note: 'no managed block' });
      continue;
    }

    if (content.trim() === '') {
      if (!opts.dryRun) rmSync(target);
      entries.push({ path: fmt.target, action: 'removed' });
    } else {
      if (!opts.dryRun) writeFileEnsuringDir(target, content);
      entries.push({ path: fmt.target, action: 'removed', note: 'kept your content' });
    }
  }

  return entries;
}
