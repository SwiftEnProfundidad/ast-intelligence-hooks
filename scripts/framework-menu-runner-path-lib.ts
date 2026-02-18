import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const resolveScriptOrReportMissing = (relativePath: string): string | undefined => {
  const repoLocalPath = resolve(process.cwd(), relativePath);
  if (existsSync(repoLocalPath)) {
    return repoLocalPath;
  }

  // Consumer repos run menu binaries from node_modules, so scripts must also
  // be resolved relative to the installed package root.
  const packageFallbackPath = resolve(__dirname, '..', relativePath);
  if (existsSync(packageFallbackPath)) {
    return packageFallbackPath;
  }

  process.stdout.write(`\nCould not find ${relativePath} in current repository.\n`);
  return undefined;
};
