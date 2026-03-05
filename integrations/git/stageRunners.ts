import { resolvePolicyForStage } from '../gate/stagePolicies';
import {
  resolveAheadBehindFromRef,
  resolveCurrentBranchRef,
  resolveCiBaseRef,
  resolvePrePushBootstrapBaseRef,
  resolveUpstreamTrackingRef,
  resolveUpstreamRef,
} from './resolveGitRefs';
import { runPlatformGate } from './runPlatformGate';
import { GitService } from './GitService';
import {
  evaluateGitAtomicity,
  type GitAtomicityEvaluation,
  type GitAtomicityStage,
} from './gitAtomicity';
import {
  emitAuditSummaryNotificationFromEvidence,
  emitGateBlockedNotification,
} from '../notifications/emitAuditSummaryNotification';
import { readFileSync } from 'node:fs';
import { readEvidence, readEvidenceResult } from '../evidence/readEvidence';
import type { EvidenceReadResult } from '../evidence/readEvidence';

const PRE_PUSH_UPSTREAM_REQUIRED_MESSAGE =
  'pumuki pre-push blocked: branch has no upstream tracking reference. Configure upstream first (for example: git push --set-upstream origin <branch>) and retry.';
const PRE_PUSH_UPSTREAM_BOOTSTRAP_FALLBACK_MESSAGE =
  '[pumuki][pre-push] branch has no upstream; using bootstrap range ';
const PRE_PUSH_UPSTREAM_MISALIGNED_AHEAD_THRESHOLD = 25;

const PRE_COMMIT_EVIDENCE_MAX_AGE_SECONDS = 900;
const PRE_PUSH_EVIDENCE_MAX_AGE_SECONDS = 1800;
const DEFAULT_BLOCKED_REMEDIATION = 'Corrige la causa del bloqueo y vuelve a ejecutar el gate.';

const BLOCKED_REMEDIATION_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Regenera .ai_evidence.json ejecutando una auditoría.',
  EVIDENCE_INVALID: 'Corrige/regenera .ai_evidence.json y vuelve a ejecutar el gate.',
  EVIDENCE_CHAIN_INVALID: 'Regenera evidencia para restaurar la cadena criptográfica.',
  EVIDENCE_STALE: 'Refresca evidencia antes de continuar.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este mismo repositorio.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en la rama actual y reintenta.',
  EVIDENCE_RULES_COVERAGE_MISSING: 'Ejecuta auditoría completa para recalcular rules_coverage.',
  EVIDENCE_RULES_COVERAGE_INCOMPLETE: 'Asegura coverage_ratio=1 y unevaluated=0.',
  GITFLOW_PROTECTED_BRANCH: 'Trabaja en feature/* y evita ramas protegidas.',
  PRE_PUSH_UPSTREAM_MISSING: 'Ejecuta: git push --set-upstream origin <branch>',
  PRE_PUSH_UPSTREAM_MISALIGNED:
    'Alinea upstream con la rama actual: git branch --unset-upstream && git push --set-upstream origin <branch>',
};

type StageRunnerDependencies = {
  resolvePolicyForStage: typeof resolvePolicyForStage;
  resolveUpstreamRef: typeof resolveUpstreamRef;
  resolveUpstreamTrackingRef: typeof resolveUpstreamTrackingRef;
  resolveCurrentBranchRef: typeof resolveCurrentBranchRef;
  resolveAheadBehindFromRef: typeof resolveAheadBehindFromRef;
  resolvePrePushBootstrapBaseRef: typeof resolvePrePushBootstrapBaseRef;
  resolveCiBaseRef: typeof resolveCiBaseRef;
  runPlatformGate: typeof runPlatformGate;
  evaluateGitAtomicity: (params: {
    repoRoot: string;
    stage: GitAtomicityStage;
    fromRef?: string;
    toRef?: string;
  }) => GitAtomicityEvaluation;
  resolveRepoRoot: () => string;
  readPrePushStdin: () => string;
  notifyAuditSummaryFromEvidence: (params: {
    repoRoot: string;
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  }) => void;
  notifyGateBlocked: (params: {
    repoRoot: string;
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
    totalViolations: number;
    causeCode: string;
    causeMessage: string;
    remediation: string;
  }) => void;
  readEvidenceResult: (repoRoot: string) => EvidenceReadResult;
  readEvidence: typeof readEvidence;
  now: () => number;
  writeHookGateSummary: (message: string) => void;
  isQuietMode: () => boolean;
};

const defaultDependencies: StageRunnerDependencies = {
  resolvePolicyForStage,
  resolveUpstreamRef,
  resolveUpstreamTrackingRef,
  resolveCurrentBranchRef,
  resolveAheadBehindFromRef,
  resolvePrePushBootstrapBaseRef,
  resolveCiBaseRef,
  runPlatformGate,
  evaluateGitAtomicity: (params) =>
    evaluateGitAtomicity({
      repoRoot: params.repoRoot,
      stage: params.stage,
      fromRef: params.fromRef,
      toRef: params.toRef,
    }),
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
  notifyGateBlocked: (params) => {
    emitGateBlockedNotification(params);
  },
  readEvidenceResult,
  readEvidence,
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

const notifyGateBlockedForStage = (params: {
  dependencies: StageRunnerDependencies;
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  fallbackCauseCode: string;
  fallbackCauseMessage: string;
  fallbackRemediation: string;
}): void => {
  const repoRoot = params.dependencies.resolveRepoRoot();
  const evidence = params.dependencies.readEvidence(repoRoot);
  const firstViolation = evidence?.ai_gate.violations[0];
  const causeCode = firstViolation?.code ?? params.fallbackCauseCode;
  const causeMessage = firstViolation?.message ?? params.fallbackCauseMessage;
  const remediation =
    BLOCKED_REMEDIATION_BY_CODE[causeCode]
    ?? params.fallbackRemediation
    ?? DEFAULT_BLOCKED_REMEDIATION;
  params.dependencies.notifyGateBlocked({
    repoRoot,
    stage: params.stage,
    totalViolations: evidence?.ai_gate.violations.length ?? 0,
    causeCode,
    causeMessage,
    remediation,
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
  const degradedSummary =
    params.policyTrace.degraded?.enabled
      ? ` degraded_mode=enabled degraded_action=${params.policyTrace.degraded.action}` +
        ` degraded_reason=${params.policyTrace.degraded.reason}`
      : '';
  params.dependencies.writeHookGateSummary(
    `[pumuki][hook-gate] stage=${params.stage} policy_bundle=${params.policyTrace.bundle} policy_hash=${params.policyTrace.hash}` +
      ` policy_version=${params.policyTrace.version ?? 'n/a'}` +
      ` policy_signature=${params.policyTrace.signature ?? 'n/a'}` +
      ` policy_source=${params.policyTrace.policySource ?? 'n/a'}` +
      `${degradedSummary}` +
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

const PRE_PUSH_TOPIC_BRANCH_PREFIXES = [
  'feature/',
  'bugfix/',
  'refactor/',
  'chore/',
  'docs/',
];

const toShortRef = (value: string): string =>
  value
    .replace(/^refs\/heads\//, '')
    .replace(/^refs\/remotes\/[^/]+\//, '')
    .replace(/^[^/]+\//, '');

const detectPrePushUpstreamMisalignment = (params: {
  dependencies: StageRunnerDependencies;
  upstreamRef: string;
}): { message: string; remediation: string } | null => {
  const currentBranch = params.dependencies.resolveCurrentBranchRef();
  const upstreamTrackingRef = params.dependencies.resolveUpstreamTrackingRef();
  if (!currentBranch || !upstreamTrackingRef) {
    return null;
  }

  const isTopicBranch = PRE_PUSH_TOPIC_BRANCH_PREFIXES.some((prefix) =>
    currentBranch.startsWith(prefix)
  );
  if (!isTopicBranch) {
    return null;
  }

  const upstreamShort = toShortRef(upstreamTrackingRef);
  if (upstreamShort !== 'main' && upstreamShort !== 'develop') {
    return null;
  }

  const aheadBehind = params.dependencies.resolveAheadBehindFromRef(params.upstreamRef);
  if (!aheadBehind || aheadBehind.ahead < PRE_PUSH_UPSTREAM_MISALIGNED_AHEAD_THRESHOLD) {
    return null;
  }

  return {
    message:
      `pumuki pre-push blocked: upstream appears misaligned for ${currentBranch}. ` +
      `tracking=${upstreamTrackingRef} ahead=${aheadBehind.ahead} behind=${aheadBehind.behind}.`,
    remediation:
      'Alinea upstream con la rama actual para evaluar solo el delta real: ' +
      'git branch --unset-upstream && git push --set-upstream origin <branch>',
  };
};

const enforceGitAtomicityGate = (params: {
  dependencies: StageRunnerDependencies;
  repoRoot: string;
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  fromRef?: string;
  toRef?: string;
}): boolean => {
  const atomicity = params.dependencies.evaluateGitAtomicity({
    repoRoot: params.repoRoot,
    stage: params.stage,
    fromRef: params.fromRef,
    toRef: params.toRef,
  });
  if (!atomicity.enabled || atomicity.allowed) {
    return false;
  }
  const firstViolation = atomicity.violations[0];
  if (!firstViolation) {
    return false;
  }
  process.stderr.write(`[pumuki][git-atomicity] ${firstViolation.code}: ${firstViolation.message}\n`);
  params.dependencies.notifyGateBlocked({
    repoRoot: params.repoRoot,
    stage: params.stage,
    totalViolations: atomicity.violations.length,
    causeCode: firstViolation.code,
    causeMessage: firstViolation.message,
    remediation: firstViolation.remediation,
  });
  notifyAuditSummaryForStage(params.dependencies, params.stage);
  return true;
};

export async function runPreCommitStage(
  dependencies: Partial<StageRunnerDependencies> = {}
): Promise<number> {
  const activeDependencies = getDependencies(dependencies);
  const repoRoot = activeDependencies.resolveRepoRoot();
  if (
    enforceGitAtomicityGate({
      dependencies: activeDependencies,
      repoRoot,
      stage: 'PRE_COMMIT',
    })
  ) {
    return 1;
  }
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
  if (exitCode !== 0) {
    notifyGateBlockedForStage({
      dependencies: activeDependencies,
      stage: 'PRE_COMMIT',
      fallbackCauseCode: 'PRE_COMMIT_GATE_BLOCKED',
      fallbackCauseMessage: 'Gate blocked pre-commit stage.',
      fallbackRemediation: DEFAULT_BLOCKED_REMEDIATION,
    });
  }
  notifyAuditSummaryForStage(activeDependencies, 'PRE_COMMIT');
  return exitCode;
}

export async function runPrePushStage(
  dependencies: Partial<StageRunnerDependencies> = {}
): Promise<number> {
  const activeDependencies = getDependencies(dependencies);
  const repoRoot = activeDependencies.resolveRepoRoot();
  const upstreamRef = activeDependencies.resolveUpstreamRef();
  if (!upstreamRef) {
    const prePushInput = activeDependencies.readPrePushStdin();
    const bootstrapBaseRef = activeDependencies.resolvePrePushBootstrapBaseRef();
    const bootstrapByPrePushStdIn = shouldAllowBootstrapPrePush(prePushInput);
    const bootstrapByFallbackBase = !bootstrapByPrePushStdIn && bootstrapBaseRef !== 'HEAD';
    if (bootstrapByPrePushStdIn || bootstrapByFallbackBase) {
      if (bootstrapByFallbackBase) {
        process.stderr.write(
          `${PRE_PUSH_UPSTREAM_BOOTSTRAP_FALLBACK_MESSAGE}${bootstrapBaseRef}..HEAD\n`
        );
      }
      if (
        enforceGitAtomicityGate({
          dependencies: activeDependencies,
          repoRoot,
          stage: 'PRE_PUSH',
          fromRef: bootstrapBaseRef,
          toRef: 'HEAD',
        })
      ) {
        return 1;
      }
      const resolved = activeDependencies.resolvePolicyForStage('PRE_PUSH');
      const exitCode = await activeDependencies.runPlatformGate({
        policy: resolved.policy,
        policyTrace: resolved.trace,
        scope: {
          kind: 'range',
          fromRef: bootstrapBaseRef,
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
    notifyGateBlockedForStage({
      dependencies: activeDependencies,
      stage: 'PRE_PUSH',
      fallbackCauseCode: 'PRE_PUSH_UPSTREAM_MISSING',
      fallbackCauseMessage: 'Branch has no upstream tracking reference.',
      fallbackRemediation: 'Ejecuta: git push --set-upstream origin <branch>',
    });
    notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
    return 1;
  }

  const misalignedUpstream = detectPrePushUpstreamMisalignment({
    dependencies: activeDependencies,
    upstreamRef,
  });
  if (misalignedUpstream) {
    process.stderr.write(`${misalignedUpstream.message}\n`);
    notifyGateBlockedForStage({
      dependencies: activeDependencies,
      stage: 'PRE_PUSH',
      fallbackCauseCode: 'PRE_PUSH_UPSTREAM_MISALIGNED',
      fallbackCauseMessage: misalignedUpstream.message,
      fallbackRemediation: misalignedUpstream.remediation,
    });
    notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
    return 1;
  }

  if (
    enforceGitAtomicityGate({
      dependencies: activeDependencies,
      repoRoot,
      stage: 'PRE_PUSH',
      fromRef: upstreamRef,
      toRef: 'HEAD',
    })
  ) {
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
  if (exitCode !== 0) {
    notifyGateBlockedForStage({
      dependencies: activeDependencies,
      stage: 'PRE_PUSH',
      fallbackCauseCode: 'PRE_PUSH_GATE_BLOCKED',
      fallbackCauseMessage: 'Gate blocked pre-push stage.',
      fallbackRemediation: DEFAULT_BLOCKED_REMEDIATION,
    });
  }
  notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
  return exitCode;
}

export async function runCiStage(
  dependencies: Partial<StageRunnerDependencies> = {}
): Promise<number> {
  const activeDependencies = getDependencies(dependencies);
  const repoRoot = activeDependencies.resolveRepoRoot();
  const ciBaseRef = activeDependencies.resolveCiBaseRef();
  if (
    enforceGitAtomicityGate({
      dependencies: activeDependencies,
      repoRoot,
      stage: 'CI',
      fromRef: ciBaseRef,
      toRef: 'HEAD',
    })
  ) {
    return 1;
  }
  const resolved = activeDependencies.resolvePolicyForStage('CI');
  const exitCode = await activeDependencies.runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: {
      kind: 'range',
      fromRef: ciBaseRef,
      toRef: 'HEAD',
    },
  });
  if (exitCode !== 0) {
    notifyGateBlockedForStage({
      dependencies: activeDependencies,
      stage: 'CI',
      fallbackCauseCode: 'CI_GATE_BLOCKED',
      fallbackCauseMessage: 'Gate blocked CI stage.',
      fallbackRemediation: DEFAULT_BLOCKED_REMEDIATION,
    });
  }
  notifyAuditSummaryForStage(activeDependencies, 'CI');
  return exitCode;
}
