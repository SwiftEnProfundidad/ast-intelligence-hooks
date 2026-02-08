import { execFileSync } from 'node:child_process';

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
};

const isResolvableRef = (ref: string): boolean => {
  try {
    runGit(['rev-parse', '--verify', ref]);
    return true;
  } catch {
    return false;
  }
};

const resolveDefaultCiBaseRef = (): string => {
  if (isResolvableRef('origin/main')) {
    return 'origin/main';
  }
  if (isResolvableRef('main')) {
    return 'main';
  }
  return 'HEAD';
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
  if (fromEnv) {
    if (isResolvableRef(fromEnv)) {
      return fromEnv;
    }

    const remoteRef = `origin/${fromEnv}`;
    if (isResolvableRef(remoteRef)) {
      return remoteRef;
    }
  }

  return resolveDefaultCiBaseRef();
};
