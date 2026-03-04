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
import { readEvidenceResult } from '../evidence/readEvidence';
import type { EvidenceReadResult } from '../evidence/readEvidence';

const PRE_PUSH_UPSTREAM_REQUIRED_MESSAGE =
  'pumuki pre-push blocked: branch has no upstream tracking reference. Configure upstream first (for example: git push --set-upstream origin <branch>) and retry.';

const PRE_COMMIT_EVIDENCE_MAX_AGE_SECONDS = 900;
const PRE_PUSH_EVIDENCE_MAX_AGE_SECONDS = 1800;

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
  readEvidenceResult: (repoRoot: string) => EvidenceReadResult;
  now: () => number;
  writeHookGateSummary: (message: string) => void;
  isQuietMode: () => boolean;
};

const defaultDependencies: StageRunnerDependencies = {
  resolvePolicyForStage,
  resolveUpstreamRef,
  resolvePrePushBootstrapBaseRef,
  resolveCiBaseRef,
  runPlatformGate,
  resolveRepoRoot: () => new GitService().resolveRepoRoot(),
  readPrePushStdin: () => {
    const envInput = process.env.PUMUKI_PRE_PUSH_STDIN;
    if (typeof envInput === 'string' && envInput.trim().length > 0) {
      return envInput;
    }
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
  readEvidenceResult,
  now: () => Date.now(),
  writeHookGateSummary: (message) => {
    process.stdout.write(`${message}\n`);
  },
  isQuietMode: () => process.argv.includes('--quiet'),
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

const toEvidenceAgeSeconds = (
  result: EvidenceReadResult,
  nowMs: number
): number | null => {
  if (result.kind !== 'valid') {
    return null;
  }
  const parsed = Date.parse(result.evidence.timestamp);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const raw = Math.floor((nowMs - parsed) / 1000);
  return raw >= 0 ? raw : 0;
};

const emitSuccessfulHookGateSummary = (params: {
  dependencies: StageRunnerDependencies;
  stage: 'PRE_COMMIT' | 'PRE_PUSH';
  policyTrace: NonNullable<ReturnType<typeof resolvePolicyForStage>['trace']>;
  exitCode: number;
}): void => {
  if (params.exitCode !== 0 || params.dependencies.isQuietMode()) {
    return;
  }
  const repoRoot = params.dependencies.resolveRepoRoot();
  const evidence = params.dependencies.readEvidenceResult(repoRoot);
  const evidenceAgeSeconds = toEvidenceAgeSeconds(evidence, params.dependencies.now());
  const maxAgeSeconds =
    params.stage === 'PRE_COMMIT'
      ? PRE_COMMIT_EVIDENCE_MAX_AGE_SECONDS
      : PRE_PUSH_EVIDENCE_MAX_AGE_SECONDS;
  params.dependencies.writeHookGateSummary(
    `[pumuki][hook-gate] stage=${params.stage} policy_bundle=${params.policyTrace.bundle} policy_hash=${params.policyTrace.hash}` +
      ` policy_version=${params.policyTrace.version ?? 'n/a'}` +
      ` policy_signature=${params.policyTrace.signature ?? 'n/a'}` +
      ` policy_source=${params.policyTrace.policySource ?? 'n/a'}` +
      ` decision=ALLOW evidence_kind=${evidence.kind} evidence_age_seconds=${evidenceAgeSeconds ?? 'n/a'} max_age_seconds=${maxAgeSeconds}`
  );
};

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
  emitSuccessfulHookGateSummary({
    dependencies: activeDependencies,
    stage: 'PRE_COMMIT',
    policyTrace: resolved.trace,
    exitCode,
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
      emitSuccessfulHookGateSummary({
        dependencies: activeDependencies,
        stage: 'PRE_PUSH',
        policyTrace: resolved.trace,
        exitCode,
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
  emitSuccessfulHookGateSummary({
    dependencies: activeDependencies,
    stage: 'PRE_PUSH',
    policyTrace: resolved.trace,
    exitCode,
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
