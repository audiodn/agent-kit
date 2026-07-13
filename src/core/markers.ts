export const END_MARKER = '<!-- AUDIODN:END -->';

// Matches a managed block regardless of the version recorded in the BEGIN marker.
export const BLOCK_RE = /<!-- AUDIODN:BEGIN[\s\S]*?<!-- AUDIODN:END -->/;

export function beginMarker(version: string): string {
  return `<!-- AUDIODN:BEGIN v${version} (managed by @audiodn/agent-kit — do not edit inside) -->`;
}

export function buildBlock(version: string, body: string): string {
  return `${beginMarker(version)}\n${body.trim()}\n${END_MARKER}`;
}

export function hasBlock(content: string): boolean {
  BLOCK_RE.lastIndex = 0;
  return BLOCK_RE.test(content);
}
