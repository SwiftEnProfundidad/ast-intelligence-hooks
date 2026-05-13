import { execFileSync as runBinarySync } from 'node:child_process';

const runGit = (args: ReadonlyArray<string>): string => {
  return runBinarySync('git', args, {
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

export const resolveUpstreamRef = (): string | null => {
  try {
    return runGit(['rev-parse', '@{u}']);
  } catch {
    return null;
  }
};

export const resolveCurrentBranchRef = (): string | null => {
  try {
    const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (branch.length === 0 || branch === 'HEAD') {
      return null;
    }
    return branch;
  } catch {
    return null;
  }
};

export const resolveUpstreamTrackingRef = (): string | null => {
  try {
    return runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  } catch {
    return null;
  }
};

export const resolveAheadBehindFromRef = (
  fromRef: string
): { ahead: number; behind: number } | null => {
  try {
    const raw = runGit(['rev-list', '--left-right', '--count', `${fromRef}...HEAD`]);
    const [behindRaw, aheadRaw] = raw.split(/\s+/);
    const ahead = Number.parseInt(aheadRaw ?? '', 10);
    const behind = Number.parseInt(behindRaw ?? '', 10);
    if (!Number.isFinite(ahead) || !Number.isFinite(behind)) {
      return null;
    }
    return { ahead, behind };
  } catch {
    return null;
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

export const resolvePrePushBootstrapBaseRef = (): string => {
  const candidates = ['origin/develop', 'develop', resolveCiBaseRef()];
  for (const candidate of candidates) {
    if (isResolvableRef(candidate)) {
      return candidate;
    }
  }

  return 'HEAD';
};
