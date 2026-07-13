import { createInterface } from 'node:readline';
import { ALL_FORMAT_IDS, FORMATS, type FormatId } from './formats.js';

export async function promptFormats(): Promise<FormatId[]> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const question = (q: string) => new Promise<string>((res) => rl.question(q, res));

  console.log('AudioDN Agent Kit — select formats to install:');
  FORMATS.forEach((f, i) => console.log(`  ${i + 1}. ${f.id.padEnd(8)} ${f.label}`));
  const ans = (await question('Enter comma-separated ids or numbers [all]: ')).trim();
  rl.close();

  if (!ans || ans.toLowerCase() === 'all') return [...ALL_FORMAT_IDS];

  const ids: FormatId[] = [];
  for (const token of ans.split(',').map((s) => s.trim()).filter(Boolean)) {
    const num = Number(token);
    if (Number.isInteger(num) && num >= 1 && num <= FORMATS.length) {
      ids.push(FORMATS[num - 1].id);
    } else if ((ALL_FORMAT_IDS as string[]).includes(token)) {
      ids.push(token as FormatId);
    }
  }
  return [...new Set(ids)];
}
