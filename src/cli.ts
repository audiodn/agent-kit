#!/usr/bin/env node
import { runInit } from './commands/init.js';
import { runList } from './commands/list.js';
import { runUninstall } from './commands/uninstall.js';
import { runValidate } from './commands/validate.js';
import { getVersion } from './version.js';

interface Parsed {
  _: string[];
  flags: Record<string, string | boolean>;
}

const VALUE_FLAGS = new Set(['formats', 'cwd', 'severity', 'path']);

function parseArgs(argv: string[]): Parsed {
  const _: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        const key = arg.slice(2);
        if (VALUE_FLAGS.has(key) && i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
          flags[key] = argv[++i];
        } else {
          flags[key] = true;
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      for (const ch of arg.slice(1)) flags[ch] = true;
    } else {
      _.push(arg);
    }
  }
  return { _, flags };
}

const HELP = `@audiodn/agent-kit — AudioDN guidance for AI coding agents

Usage:
  npx @audiodn/agent-kit <command> [options]

Commands:
  init                 Install AudioDN guidance (merge-safe, idempotent)
  validate [path]      Scan a project for common AudioDN mistakes
  uninstall            Remove managed blocks / kit-owned files only
  list                 Show formats and bundled documentation versions

Options:
  -y, --yes            Non-interactive; install all formats unless --formats given
  --formats <ids>      Comma-separated: agents,claude,copilot,cursor,skill (or "all")
  --dry-run            Report actions without writing
  --force              Overwrite unmanaged conflicts
  --cwd <dir>          Target directory (default: current directory)
  --json               (validate) Output findings as JSON
  -v, --version        Print version
  -h, --help           Show this help
`;

async function main(): Promise<number> {
  const { _, flags } = parseArgs(process.argv.slice(2));
  const cmd = _[0];
  const cwd = (flags.cwd as string) || process.cwd();

  if (flags.version || flags.v) {
    console.log(getVersion());
    return 0;
  }
  if (!cmd || flags.help || flags.h || cmd === 'help') {
    console.log(HELP);
    return 0;
  }

  switch (cmd) {
    case 'init':
      return runInit({
        cwd,
        yes: Boolean(flags.yes || flags.y),
        dryRun: Boolean(flags['dry-run']),
        force: Boolean(flags.force),
        formats: typeof flags.formats === 'string' ? flags.formats : undefined,
      });
    case 'validate':
      return runValidate({ path: _[1] || cwd, json: Boolean(flags.json) });
    case 'uninstall':
      return runUninstall({
        cwd,
        dryRun: Boolean(flags['dry-run']),
        formats: typeof flags.formats === 'string' ? flags.formats : undefined,
      });
    case 'list':
      return runList();
    default:
      console.error(`Unknown command: ${cmd}\n`);
      console.log(HELP);
      return 1;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
