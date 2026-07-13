import { describe, expect, it } from 'vitest';
import { parseFormatList } from '../src/core/formats.js';

describe('parseFormatList', () => {
  it('parses a comma list', () => {
    expect(parseFormatList('agents,cursor,skill')).toEqual({ ids: ['agents', 'cursor', 'skill'], unknown: [] });
  });

  it('expands "all"', () => {
    const { ids } = parseFormatList('all');
    expect(ids).toEqual(['agents', 'claude', 'copilot', 'cursor', 'skill']);
  });

  it('collects unknown ids', () => {
    expect(parseFormatList('agents,bogus').unknown).toEqual(['bogus']);
  });
});
