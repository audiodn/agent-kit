import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SKILL_DIR } from '../paths.js';

export interface ValidateArgs {
  path: string;
  json: boolean;
}

// The validator implementation lives in the portable Skill payload so it can be
// run standalone (without the kit) once installed. We import it here to avoid
// duplicating the rule logic.
export async function runValidate(args: ValidateArgs): Promise<number> {
  const validatorUrl = pathToFileURL(join(SKILL_DIR, 'scripts', 'validate.mjs')).href;
  const mod = await import(validatorUrl);
  const result = await mod.runValidation(resolve(args.path), {});

  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    mod.printFindings(result);
  }

  return result.errorCount > 0 ? 1 : 0;
}
