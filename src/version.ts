import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PACKAGE_ROOT } from './paths.js';

export function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}
