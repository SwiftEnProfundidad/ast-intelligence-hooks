import { execFileSync as runBinarySync } from 'node:child_process';

const runGit = (args: ReadonlyArray<string>): string => {
  return runBinarySync('git', args, { encoding: 'utf8' }).trim();
};

export const resolveDefaultRangeFrom = (): string => {
  try {
    return runGit(['rev-parse', '@{u}']);
  } catch {
    return 'HEAD~1';
  }
};
