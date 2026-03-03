import { resolvePolicyForStage } from '../gate/stagePolicies';
import {
  resolveCiBaseRef,
  resolvePrePushBootstrapBaseRef,
  resolveUpstreamRef,
} from './resolveGitRefs';
import { runPlatformGate } from './runPlatformGate';
import { GitService } from './GitService';
import { emitAuditSummaryNotificationFromEvidence } from '../notifications/emitAuditSummaryNotification';
import { readFileSync } from 'node:fs';

const PRE_PUSH_UPSTREAM_REQUIRED_MESSAGE =
  'pumuki pre-push blocked: branch has no upstream tracking reference. Configure upstream first (for example: git push --set-upstream origin <branch>) and retry.';

type StageRunnerDependencies = {
  resolvePolicyForStage: typeof resolvePolicyForStage;
  resolveUpstreamRef: typeof resolveUpstreamRef;
  resolvePrePushBootstrapBaseRef: typeof resolvePrePushBootstrapBaseRef;
  resolveCiBaseRef: typeof resolveCiBaseRef;
  runPlatformGate: typeof runPlatformGate;
  resolveRepoRoot: () => string;
  readPrePushStdin: () => string;
  notifyAuditSummaryFromEvidence: (params: {
    repoRoot: string;
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  }) => void;
};

const defaultDependencies: StageRunnerDependencies = {
  resolvePolicyForStage,
  resolveUpstreamRef,
  resolvePrePushBootstrapBaseRef,
  resolveCiBaseRef,
  runPlatformGate,
  resolveRepoRoot: () => new GitService().resolveRepoRoot(),
  readPrePushStdin: () => {
    if (process.stdin.isTTY) {
      return '';
    }
    try {
      return readFileSync(0, 'utf8');
    } catch {
      return '';
    }
  },
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

const ZERO_HASH = /^0+$/;

const shouldAllowBootstrapPrePush = (rawInput: string): boolean => {
  const lines = rawInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const [localRef, localOid, remoteRef, remoteOid] = line.split(/\s+/);
    if (!localRef || !localOid || !remoteRef || !remoteOid) {
      continue;
    }
    const localIsBranch = localRef.startsWith('refs/heads/');
    const remoteIsBranch = remoteRef.startsWith('refs/heads/');
    const localIsDeletion = ZERO_HASH.test(localOid);
    const remoteIsNewBranch = ZERO_HASH.test(remoteOid);

    if (localIsBranch && remoteIsBranch && !localIsDeletion && remoteIsNewBranch) {
      return true;
    }
  }

  return false;
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
    const prePushInput = activeDependencies.readPrePushStdin();
    if (shouldAllowBootstrapPrePush(prePushInput)) {
      const resolved = activeDependencies.resolvePolicyForStage('PRE_PUSH');
      const exitCode = await activeDependencies.runPlatformGate({
        policy: resolved.policy,
        policyTrace: resolved.trace,
        scope: {
          kind: 'range',
          fromRef: activeDependencies.resolvePrePushBootstrapBaseRef(),
          toRef: 'HEAD',
        },
      });
      notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
      return exitCode;
    }
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
