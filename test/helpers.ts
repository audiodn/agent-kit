import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function mkTmp(): string {
  return mkdtempSync(join(tmpdir(), 'adn-agent-kit-test-'));
}
