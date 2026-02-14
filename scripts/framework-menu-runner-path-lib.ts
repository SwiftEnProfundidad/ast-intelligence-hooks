import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const resolveScriptOrReportMissing = (relativePath: string): string | undefined => {
  const scriptPath = resolve(process.cwd(), relativePath);
  if (existsSync(scriptPath)) {
    return scriptPath;
  }

  process.stdout.write(`\nCould not find ${relativePath} in current repository.\n`);
  return undefined;
};
