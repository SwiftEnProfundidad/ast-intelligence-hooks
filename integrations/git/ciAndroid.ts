import { execFileSync } from 'node:child_process';
import { policyForCI } from '../gate/stagePolicies';
import { runPlatformGate } from './runPlatformGate';

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' });
};

const resolveBaseRef = (): string => {
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

export async function runCiAndroid(): Promise<number> {
  return runPlatformGate({
    policy: policyForCI(),
    scope: {
      kind: 'range',
      fromRef: resolveBaseRef(),
      toRef: 'HEAD',
    },
  });
}
