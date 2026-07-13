import { BLOCK_RE, buildBlock, hasBlock } from './markers.js';

export type MergeAction = 'create' | 'update' | 'unchanged' | 'append' | 'conflict';

export interface MergeResult {
  content: string | null;
  action: MergeAction;
}

export interface MergeOptions {
  preambleOnCreate?: string;
  appendIfUnmanaged: boolean;
}

/**
 * Merge a managed block into (possibly existing) file content without ever
 * clobbering user content outside the block.
 */
export function mergeBlock(
  existing: string | null,
  version: string,
  body: string,
  opts: MergeOptions,
): MergeResult {
  const block = buildBlock(version, body);

  if (existing === null) {
    const preamble = opts.preambleOnCreate ? `${opts.preambleOnCreate.replace(/\n*$/, '')}\n\n` : '';
    return { content: `${preamble}${block}\n`, action: 'create' };
  }

  if (hasBlock(existing)) {
    const replaced = existing.replace(BLOCK_RE, block);
    if (replaced === existing) return { content: existing, action: 'unchanged' };
    return { content: replaced, action: 'update' };
  }

  if (opts.appendIfUnmanaged) {
    const sep = existing.endsWith('\n') ? '\n' : '\n\n';
    return { content: `${existing}${sep}${block}\n`, action: 'append' };
  }

  return { content: null, action: 'conflict' };
}

/**
 * Remove the managed block. Returns changed=false if there was no block.
 */
export function removeBlock(existing: string): { content: string; changed: boolean } {
  if (!hasBlock(existing)) return { content: existing, changed: false };
  let out = existing.replace(BLOCK_RE, '');
  // Tidy the whitespace left behind.
  out = out.replace(/\n{3,}/g, '\n\n').replace(/^\s+/, '');
  if (out.trim().length > 0) out = out.replace(/\s+$/, '') + '\n';
  else out = '';
  return { content: out, changed: true };
}
