export type Action =
  | 'create'
  | 'update'
  | 'unchanged'
  | 'append'
  | 'conflict'
  | 'removed'
  | 'skipped';

export interface ReportEntry {
  path: string;
  action: Action;
  note?: string;
}

const SYMBOL: Record<Action, string> = {
  create: '+ created ',
  update: '~ updated ',
  append: '~ appended',
  unchanged: '= unchanged',
  conflict: '! conflict',
  removed: '- removed ',
  skipped: '. skipped ',
};

export function printReport(entries: ReportEntry[], opts: { dryRun?: boolean } = {}): void {
  const prefix = opts.dryRun ? '[dry-run] ' : '';
  if (entries.length === 0) {
    console.log(`${prefix}Nothing to do.`);
    return;
  }
  for (const e of entries) {
    const label = SYMBOL[e.action] ?? e.action;
    const note = e.note ? `  (${e.note})` : '';
    console.log(`${prefix}${label}  ${e.path}${note}`);
  }
  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.action] = (acc[e.action] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(counts)
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
  console.log(`${prefix}Summary: ${summary}`);
  if (counts.conflict) {
    console.log(
      `${prefix}Conflicts were written as *.audiodn.new — review and merge, or re-run with --force.`,
    );
  }
}

export function hasConflicts(entries: ReportEntry[]): boolean {
  return entries.some((e) => e.action === 'conflict');
}
