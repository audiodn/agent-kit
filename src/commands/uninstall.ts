import { ALL_FORMAT_IDS, type FormatId, parseFormatList } from '../core/formats.js';
import { uninstallFormats } from '../core/install.js';
import { printReport } from '../core/report.js';

export interface UninstallArgs {
  cwd: string;
  dryRun: boolean;
  formats?: string;
}

export function runUninstall(args: UninstallArgs): number {
  let ids: FormatId[];
  if (args.formats) {
    const { ids: parsed, unknown } = parseFormatList(args.formats);
    if (unknown.length) {
      console.error(`Unknown format(s): ${unknown.join(', ')}.`);
      return 1;
    }
    ids = parsed.length ? parsed : [...ALL_FORMAT_IDS];
  } else {
    ids = [...ALL_FORMAT_IDS];
  }

  const entries = uninstallFormats({ cwd: args.cwd, formats: ids, dryRun: args.dryRun });
  printReport(entries, { dryRun: args.dryRun });
  return 0;
}
