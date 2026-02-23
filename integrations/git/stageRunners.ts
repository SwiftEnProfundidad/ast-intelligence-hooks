import { resolvePolicyForStage } from '../gate/stagePolicies';
import { resolveCiBaseRef, resolveUpstreamRef } from './resolveGitRefs';
import { runPlatformGate } from './runPlatformGate';
import { GitService } from './GitService';
import { emitAuditSummaryNotificationFromEvidence } from '../notifications/emitAuditSummaryNotification';

const PRE_PUSH_UPSTREAM_REQUIRED_MESSAGE =
  'pumuki pre-push blocked: branch has no upstream tracking reference. Configure upstream first (for example: git push --set-upstream origin <branch>) and retry.';

type StageRunnerDependencies = {
  resolvePolicyForStage: typeof resolvePolicyForStage;
  resolveUpstreamRef: typeof resolveUpstreamRef;
  resolveCiBaseRef: typeof resolveCiBaseRef;
  runPlatformGate: typeof runPlatformGate;
  resolveRepoRoot: () => string;
  notifyAuditSummaryFromEvidence: (params: {
    repoRoot: string;
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  }) => void;
};

const defaultDependencies: StageRunnerDependencies = {
  resolvePolicyForStage,
  resolveUpstreamRef,
  resolveCiBaseRef,
  runPlatformGate,
  resolveRepoRoot: () => new GitService().resolveRepoRoot(),
  notifyAuditSummaryFromEvidence: ({ repoRoot, stage }) => {
    emitAuditSummaryNotificationFromEvidence({
      repoRoot,
      stage,
    });
  },
};

const getDependencies = (
  dependencies: Partial<StageRunnerDependencies>
): StageRunnerDependencies => ({
  ...defaultDependencies,
  ...dependencies,
});

const notifyAuditSummaryForStage = (
  dependencies: StageRunnerDependencies,
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI'
): void => {
  dependencies.notifyAuditSummaryFromEvidence({
    repoRoot: dependencies.resolveRepoRoot(),
    stage,
  });
};

export async function runPreCommitStage(
  dependencies: Partial<StageRunnerDependencies> = {}
): Promise<number> {
  const activeDependencies = getDependencies(dependencies);
  const resolved = activeDependencies.resolvePolicyForStage('PRE_COMMIT');
  const exitCode = await activeDependencies.runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: {
      kind: 'staged',
    },
  });
  notifyAuditSummaryForStage(activeDependencies, 'PRE_COMMIT');
  return exitCode;
}

export async function runPrePushStage(
  dependencies: Partial<StageRunnerDependencies> = {}
): Promise<number> {
  const activeDependencies = getDependencies(dependencies);
  const upstreamRef = activeDependencies.resolveUpstreamRef();
  if (!upstreamRef) {
    process.stderr.write(`${PRE_PUSH_UPSTREAM_REQUIRED_MESSAGE}\n`);
    notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
    return 1;
  }

  const resolved = activeDependencies.resolvePolicyForStage('PRE_PUSH');
  const exitCode = await activeDependencies.runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: {
      kind: 'range',
      fromRef: upstreamRef,
      toRef: 'HEAD',
    },
  });
  notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
  return exitCode;
}

export async function runCiStage(
  dependencies: Partial<StageRunnerDependencies> = {}
): Promise<number> {
  const activeDependencies = getDependencies(dependencies);
  const resolved = activeDependencies.resolvePolicyForStage('CI');
  const exitCode = await activeDependencies.runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: {
      kind: 'range',
      fromRef: activeDependencies.resolveCiBaseRef(),
      toRef: 'HEAD',
    },
  });
  notifyAuditSummaryForStage(activeDependencies, 'CI');
  return exitCode;
}
