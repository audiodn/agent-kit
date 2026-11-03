#!/usr/bin/env node
/**
 * Compatibility shim: agent-kit historically shipped validate.mjs.
 * The product validator lives in validate-audiodn-project.mjs (from ai-plugin).
 */
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mod = await import(pathToFileURL(join(here, 'validate-audiodn-project.mjs')).href);

export const runValidation = mod.runValidation;
export const printFindings = mod.printFindings;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] || '.';
  const result = runValidation(root, {});
  printFindings(result);
  process.exit(result.errorCount > 0 ? 1 : 0);
}
