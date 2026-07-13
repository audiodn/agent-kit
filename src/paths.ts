import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Resolves the package root in both dev (src/paths.ts) and build (dist/paths.js):
// in both cases the file sits one directory below the package root.
const here = dirname(fileURLToPath(import.meta.url));

export const PACKAGE_ROOT = join(here, '..');
export const ASSETS_DIR = join(PACKAGE_ROOT, 'assets');
export const CONTENT_DIR = join(ASSETS_DIR, 'content');
export const SKILL_DIR = join(ASSETS_DIR, 'skill');
export const SNAPSHOTS_DIR = join(ASSETS_DIR, 'snapshots');
