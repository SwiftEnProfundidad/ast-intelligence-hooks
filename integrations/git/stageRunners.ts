import { policyForCI, policyForPreCommit, policyForPrePush } from '../gate/stagePolicies';
import { resolveCiBaseRef, resolveUpstreamRef } from './resolveGitRefs';
import { runPlatformGate } from './runPlatformGate';

export async function runPreCommitStage(): Promise<number> {
  return runPlatformGate({
    policy: policyForPreCommit(),
    scope: {
      kind: 'staged',
    },
  });
}

export async function runPrePushStage(): Promise<number> {
  return runPlatformGate({
    policy: policyForPrePush(),
    scope: {
      kind: 'range',
      fromRef: resolveUpstreamRef(),
      toRef: 'HEAD',
    },
  });
}

export async function runCiStage(): Promise<number> {
  return runPlatformGate({
    policy: policyForCI(),
    scope: {
      kind: 'range',
      fromRef: resolveCiBaseRef(),
      toRef: 'HEAD',
    },
  });
}
