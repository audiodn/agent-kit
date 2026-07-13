import { existsSync, readdirSync, rmSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';
import { SKILL_DIR } from '../paths.js';
import { readIfExists, relativeFiles, sha256, writeFileEnsuringDir } from './fsutil.js';
import type { ReportEntry } from './report.js';

export const SKILL_TARGET_DIR = '.agents/skills/audiodn';
const MANIFEST_NAME = '.audiodn-manifest.json';

interface Manifest {
  version: string;
  files: Record<string, string>; // relPath -> sha256 of the installed content
}

function manifestPath(base: string): string {
  return join(base, MANIFEST_NAME);
}

function readManifest(base: string): Manifest | null {
  const raw = readIfExists(manifestPath(base));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Manifest;
  } catch {
    return null;
  }
}

interface SkillOptions {
  dryRun?: boolean;
  force?: boolean;
}

/**
 * Install the Skill payload directory. Kit-owned files are tracked in a
 * manifest so re-runs are idempotent and user edits are never clobbered.
 */
export function installSkill(cwd: string, version: string, opts: SkillOptions = {}): ReportEntry[] {
  const base = join(cwd, SKILL_TARGET_DIR);
  const prevManifest = readManifest(base);
  const entries: ReportEntry[] = [];
  const nextFiles: Record<string, string> = {};

  for (const rel of relativeFiles(SKILL_DIR)) {
    const srcContent = readIfExists(join(SKILL_DIR, rel));
    if (srcContent === null) continue;
    const srcHash = sha256(srcContent);
    const targetPath = join(base, rel);
    const displayPath = `${SKILL_TARGET_DIR}/${rel}`;
    const existing = readIfExists(targetPath);

    if (existing === null) {
      if (!opts.dryRun) writeFileEnsuringDir(targetPath, srcContent);
      entries.push({ path: displayPath, action: 'create' });
      nextFiles[rel] = srcHash;
      continue;
    }

    const existingHash = sha256(existing);
    const tracked = prevManifest?.files?.[rel];
    const userModified = tracked === undefined || tracked !== existingHash;

    if (userModified && !opts.force) {
      if (!opts.dryRun) writeFileEnsuringDir(`${targetPath}.audiodn.new`, srcContent);
      entries.push({ path: displayPath, action: 'conflict', note: 'wrote .audiodn.new' });
      nextFiles[rel] = tracked ?? existingHash;
      continue;
    }

    if (existingHash === srcHash) {
      entries.push({ path: displayPath, action: 'unchanged' });
      nextFiles[rel] = srcHash;
      continue;
    }

    if (!opts.dryRun) writeFileEnsuringDir(targetPath, srcContent);
    entries.push({ path: displayPath, action: 'update' });
    nextFiles[rel] = srcHash;
  }

  if (!opts.dryRun) {
    const manifest: Manifest = { version, files: nextFiles };
    writeFileEnsuringDir(manifestPath(base), `${JSON.stringify(manifest, null, 2)}\n`);
  }

  return entries;
}

function pruneEmptyDirs(base: string, cwd: string): void {
  let dir = base;
  while (dir.startsWith(cwd) && dir !== cwd) {
    try {
      if (existsSync(dir) && readdirSync(dir).length === 0) {
        rmdirSync(dir);
        dir = join(dir, '..');
      } else break;
    } catch {
      break;
    }
  }
}

export function uninstallSkill(cwd: string, opts: SkillOptions = {}): ReportEntry[] {
  const base = join(cwd, SKILL_TARGET_DIR);
  const manifest = readManifest(base);
  const entries: ReportEntry[] = [];
  if (!manifest) return entries;

  for (const [rel, hash] of Object.entries(manifest.files)) {
    const targetPath = join(base, rel);
    const displayPath = `${SKILL_TARGET_DIR}/${rel}`;
    const existing = readIfExists(targetPath);
    if (existing === null) continue;
    if (sha256(existing) !== hash) {
      entries.push({ path: displayPath, action: 'skipped', note: 'modified by you' });
      continue;
    }
    if (!opts.dryRun) rmSync(targetPath);
    entries.push({ path: displayPath, action: 'removed' });
  }

  if (!opts.dryRun) {
    const mp = manifestPath(base);
    if (existsSync(mp)) rmSync(mp);
    pruneEmptyDirs(join(base, 'scripts'), cwd);
    pruneEmptyDirs(join(base, 'references'), cwd);
    pruneEmptyDirs(join(base, 'templates'), cwd);
    pruneEmptyDirs(base, cwd);
  }

  return entries;
}
