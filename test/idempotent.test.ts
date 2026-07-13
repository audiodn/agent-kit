import { describe, expect, it } from 'vitest';
import { installFormats } from '../src/core/install.js';
import { ALL_FORMAT_IDS } from '../src/core/formats.js';
import { mkTmp } from './helpers.js';

describe('idempotency', () => {
  it('reports all unchanged on a second identical run', () => {
    const cwd = mkTmp();
    installFormats({ cwd, version: '0.1.0', formats: [...ALL_FORMAT_IDS] });
    const second = installFormats({ cwd, version: '0.1.0', formats: [...ALL_FORMAT_IDS] });
    expect(second.length).toBeGreaterThan(0);
    expect(second.every((e) => e.action === 'unchanged')).toBe(true);
  });

  it('updates the block when the version changes', () => {
    const cwd = mkTmp();
    installFormats({ cwd, version: '0.1.0', formats: ['agents'] });
    const bumped = installFormats({ cwd, version: '0.2.0', formats: ['agents'] });
    expect(bumped[0].action).toBe('update');
  });
});
