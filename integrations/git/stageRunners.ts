import { resolvePolicyForStage } from '../gate/stagePolicies';
import { resolveCiBaseRef, resolveUpstreamRef } from './resolveGitRefs';
import { runPlatformGate } from './runPlatformGate';

export async function runPreCommitStage(): Promise<number> {
  const resolved = resolvePolicyForStage('PRE_COMMIT');
  return runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: {
      kind: 'staged',
    },
  });
}

export async function runPrePushStage(): Promise<number> {
  const resolved = resolvePolicyForStage('PRE_PUSH');
  return runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: {
      kind: 'range',
      fromRef: resolveUpstreamRef(),
      toRef: 'HEAD',
    },
  });
}

export async function runCiStage(): Promise<number> {
  const resolved = resolvePolicyForStage('CI');
  return runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: {
      kind: 'range',
      fromRef: resolveCiBaseRef(),
      toRef: 'HEAD',
    },
  });
}
