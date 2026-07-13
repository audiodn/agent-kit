import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function readIfExists(path: string): string | null {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

export function writeFileEnsuringDir(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

export function listFilesRecursive(root: string): string[] {
  const out: string[] = [];
  if (!existsSync(root)) return out;
  for (const name of readdirSync(root)) {
    const full = join(root, name);
    if (statSync(full).isDirectory()) out.push(...listFilesRecursive(full));
    else out.push(full);
  }
  return out;
}

export function relativeFiles(root: string): string[] {
  return listFilesRecursive(root).map((f) => relative(root, f).split('\\').join('/'));
}
