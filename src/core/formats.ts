export type FormatId = 'agents' | 'claude' | 'copilot' | 'cursor' | 'skill';

export interface BlockFormat {
  id: Exclude<FormatId, 'skill'>;
  label: string;
  kind: 'block';
  target: string;
  appendIfUnmanaged: boolean;
  preambleOnCreate?: string;
}

export interface SkillFormat {
  id: 'skill';
  label: string;
  kind: 'skill';
  target: string;
}

export type Format = BlockFormat | SkillFormat;

const CURSOR_FRONTMATTER = `---
description: AudioDN integration guidance for AI coding agents (auth, upload flow, processing readiness, playback, security).
globs:
alwaysApply: false
---`;

export const FORMATS: Format[] = [
  { id: 'agents', label: 'AGENTS.md', kind: 'block', target: 'AGENTS.md', appendIfUnmanaged: true },
  { id: 'claude', label: 'CLAUDE.md', kind: 'block', target: 'CLAUDE.md', appendIfUnmanaged: true },
  {
    id: 'copilot',
    label: 'GitHub Copilot',
    kind: 'block',
    target: '.github/copilot-instructions.md',
    appendIfUnmanaged: true,
  },
  {
    id: 'cursor',
    label: 'Cursor rule',
    kind: 'block',
    target: '.cursor/rules/audiodn.mdc',
    appendIfUnmanaged: false,
    preambleOnCreate: CURSOR_FRONTMATTER,
  },
  { id: 'skill', label: 'AudioDN Skill', kind: 'skill', target: '.agents/skills/audiodn' },
];

export const ALL_FORMAT_IDS: FormatId[] = FORMATS.map((f) => f.id);

export function resolveFormats(ids: FormatId[]): Format[] {
  return FORMATS.filter((f) => ids.includes(f.id));
}

export function parseFormatList(value: string): { ids: FormatId[]; unknown: string[] } {
  const ids: FormatId[] = [];
  const unknown: string[] = [];
  for (const raw of value.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (raw === 'all') {
      return { ids: [...ALL_FORMAT_IDS], unknown: [] };
    }
    if ((ALL_FORMAT_IDS as string[]).includes(raw)) ids.push(raw as FormatId);
    else unknown.push(raw);
  }
  return { ids, unknown };
}
