import { resolvePolicyForStage } from '../gate/stagePolicies';
import { resolveCiBaseRef, resolveUpstreamRef } from './resolveGitRefs';
import { runPlatformGate } from './runPlatformGate';

const PRE_PUSH_UPSTREAM_REQUIRED_MESSAGE =
  'pumuki pre-push blocked: branch has no upstream tracking reference. Configure upstream first (for example: git push --set-upstream origin <branch>) and retry.';

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
  const upstreamRef = resolveUpstreamRef();
  if (!upstreamRef) {
    console.error(PRE_PUSH_UPSTREAM_REQUIRED_MESSAGE);
    return 1;
  }

  const resolved = resolvePolicyForStage('PRE_PUSH');
  return runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: {
      kind: 'range',
      fromRef: upstreamRef,
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
