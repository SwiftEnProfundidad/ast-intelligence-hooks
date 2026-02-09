import { execFileSync } from 'node:child_process';

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
};

export const resolveDefaultRangeFrom = (): string => {
  try {
    return runGit(['rev-parse', '@{u}']);
  } catch {
    return 'HEAD~1';
  }
};
