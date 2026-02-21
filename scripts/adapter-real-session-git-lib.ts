import { execFileSync as runBinarySync } from 'node:child_process';

export const runGitOrUnknown = (cwd: string, args: ReadonlyArray<string>): string => {
  try {
    return runBinarySync('git', [...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
};
