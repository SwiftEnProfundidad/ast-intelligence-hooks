import { execFileSync } from 'node:child_process';
import { policyForPrePush } from '../gate/stagePolicies';
import { runPlatformGate } from './runPlatformGate';

const resolveUpstream = (): string => {
  try {
    return execFileSync('git', ['rev-parse', '@{u}'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'HEAD';
  }
};

export async function runPrePushIOS(): Promise<number> {
  return runPlatformGate({
    policy: policyForPrePush(),
    scope: {
      kind: 'range',
      fromRef: resolveUpstream(),
      toRef: 'HEAD',
      extensions: ['.swift', '.ts'],
    },
  });
}
