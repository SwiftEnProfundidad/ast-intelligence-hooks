import { execFileSync } from 'node:child_process';

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
};

export const resolveUpstreamRef = (): string => {
  try {
    return runGit(['rev-parse', '@{u}']);
  } catch {
    return 'HEAD';
  }
};

export const resolveCiBaseRef = (): string => {
  const fromEnv = process.env.GITHUB_BASE_REF?.trim();
  if (!fromEnv) {
    return 'origin/main';
  }

  try {
    runGit(['rev-parse', '--verify', fromEnv]);
    return fromEnv;
  } catch {
    const remoteRef = `origin/${fromEnv}`;
    try {
      runGit(['rev-parse', '--verify', remoteRef]);
      return remoteRef;
    } catch {
      return fromEnv;
    }
  }
};
