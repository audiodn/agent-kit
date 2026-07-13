import { describe, expect, it } from 'vitest';
import { hasBlock } from '../src/core/markers.js';
import { mergeBlock, removeBlock } from '../src/core/merge.js';

const V = '0.1.0';
const BODY = '# AudioDN\n\nguidance body';

describe('mergeBlock', () => {
  it('creates a file with a managed block when absent', () => {
    const r = mergeBlock(null, V, BODY, { appendIfUnmanaged: true });
    expect(r.action).toBe('create');
    expect(hasBlock(r.content!)).toBe(true);
    expect(r.content).toContain('guidance body');
  });

  it('appends to an unmanaged file, preserving user content', () => {
    const existing = '# My own notes\n\nkeep me\n';
    const r = mergeBlock(existing, V, BODY, { appendIfUnmanaged: true });
    expect(r.action).toBe('append');
    expect(r.content).toContain('keep me');
    expect(hasBlock(r.content!)).toBe(true);
  });

  it('conflicts on an unmanaged file when appending is disallowed', () => {
    const r = mergeBlock('some cursor rule', V, BODY, { appendIfUnmanaged: false });
    expect(r.action).toBe('conflict');
    expect(r.content).toBeNull();
  });

  it('replaces only the block on update, keeping surrounding content', () => {
    const first = mergeBlock('intro\n', V, BODY, { appendIfUnmanaged: true }).content!;
    const updated = mergeBlock(first, V, '# AudioDN\n\nNEW body', { appendIfUnmanaged: true });
    expect(updated.action).toBe('update');
    expect(updated.content).toContain('intro');
    expect(updated.content).toContain('NEW body');
    expect(updated.content).not.toContain('guidance body');
  });

  it('reports unchanged when the block is identical', () => {
    const first = mergeBlock(null, V, BODY, { appendIfUnmanaged: true }).content!;
    const again = mergeBlock(first, V, BODY, { appendIfUnmanaged: true });
    expect(again.action).toBe('unchanged');
    expect(again.content).toBe(first);
  });
});

describe('removeBlock', () => {
  it('removes the managed block and keeps user content', () => {
    const withBlock = mergeBlock('mine\n', V, BODY, { appendIfUnmanaged: true }).content!;
    const { content, changed } = removeBlock(withBlock);
    expect(changed).toBe(true);
    expect(content).toContain('mine');
    expect(hasBlock(content)).toBe(false);
  });

  it('is a no-op with no block', () => {
    const { changed } = removeBlock('nothing here');
    expect(changed).toBe(false);
  });
});
