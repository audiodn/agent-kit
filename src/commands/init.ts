import { ALL_FORMAT_IDS, type FormatId, parseFormatList } from '../core/formats.js';
import { installFormats } from '../core/install.js';
import { promptFormats } from '../core/prompt.js';
import { hasConflicts, printReport } from '../core/report.js';
import { getVersion } from '../version.js';

export interface InitArgs {
  cwd: string;
  yes: boolean;
  dryRun: boolean;
  force: boolean;
  formats?: string;
}

export async function runInit(args: InitArgs): Promise<number> {
  let ids: FormatId[];

  if (args.formats) {
    const { ids: parsed, unknown } = parseFormatList(args.formats);
    if (unknown.length) {
      console.error(`Unknown format(s): ${unknown.join(', ')}. Valid: ${ALL_FORMAT_IDS.join(', ')}, all`);
      return 1;
    }
    ids = parsed.length ? parsed : [...ALL_FORMAT_IDS];
  } else if (args.yes) {
    ids = [...ALL_FORMAT_IDS];
  } else {
    ids = await promptFormats();
  }

  if (ids.length === 0) {
    console.log('No formats selected. Nothing to do.');
    return 0;
  }

  const entries = installFormats({
    cwd: args.cwd,
    version: getVersion(),
    formats: ids,
    dryRun: args.dryRun,
    force: args.force,
  });

  printReport(entries, { dryRun: args.dryRun });
  return hasConflicts(entries) && !args.force ? 2 : 0;
}
