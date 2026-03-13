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
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readEvidence, readEvidenceResult } from '../evidence/readEvidence';
import type { EvidenceReadResult } from '../evidence/readEvidence';
import type { SnapshotFinding } from '../evidence/schema';
import { ensureRuntimeArtifactsIgnored } from '../lifecycle/artifacts';
import { runPolicyReconcile } from '../lifecycle/policyReconcile';
import { isSeverityAtLeast } from '../../core/rules/Severity';
import type { SddDecision } from '../sdd';
import {
  resolveGitAtomicityEnforcement,
  type GitAtomicityEnforcementResolution,
} from '../policy/gitAtomicityEnforcement';

const PRE_PUSH_UPSTREAM_REQUIRED_MESSAGE =
  'pumuki pre-push blocked: branch has no upstream tracking reference. Configure upstream first (for example: git push --set-upstream origin <branch>) and retry.';
const PRE_PUSH_UPSTREAM_BOOTSTRAP_FALLBACK_MESSAGE =
  '[pumuki][pre-push] branch has no upstream; using bootstrap range ';
const PRE_PUSH_MANUAL_FALLBACK_MESSAGE =
  '[pumuki][pre-push] branch has no upstream and stdin is empty; using working-tree fallback scope.';
const PRE_PUSH_UPSTREAM_MISALIGNED_AHEAD_THRESHOLD = 5;

const PRE_COMMIT_EVIDENCE_MAX_AGE_SECONDS = 900;
const PRE_PUSH_EVIDENCE_MAX_AGE_SECONDS = 1800;
const HOOK_GATE_PROGRESS_REMINDER_MS = 2000;
const DEFAULT_BLOCKED_REMEDIATION = 'Corrige la causa del bloqueo y vuelve a ejecutar el gate.';
const EVIDENCE_FILE_PATH = '.ai_evidence.json';

const BLOCKED_REMEDIATION_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Regenera .ai_evidence.json ejecutando una auditoría.',
  EVIDENCE_INVALID: 'Corrige/regenera .ai_evidence.json y vuelve a ejecutar el gate.',
  EVIDENCE_CHAIN_INVALID: 'Regenera evidencia para restaurar la cadena criptográfica.',
  EVIDENCE_STAGE_SYNC_FAILED:
    'Sincroniza la evidencia trackeada y reintenta: git add -- .ai_evidence.json && git commit --amend --no-edit',
  EVIDENCE_STALE: 'Refresca evidencia antes de continuar.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este mismo repositorio.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en la rama actual y reintenta.',
  EVIDENCE_RULES_COVERAGE_MISSING: 'Ejecuta auditoría completa para recalcular rules_coverage.',
  EVIDENCE_RULES_COVERAGE_INCOMPLETE: 'Asegura coverage_ratio=1 y unevaluated=0.',
  ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH:
    'Reconcilia policy/skills y reintenta PRE_COMMIT: npx --yes --package pumuki@latest pumuki policy reconcile --strict --json && npx --yes --package pumuki@latest pumuki-pre-commit',
  EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES:
    'Reconcilia policy/skills y revalida PRE_WRITE: npx --yes --package pumuki@latest pumuki policy reconcile --strict --json && npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json',
  GITFLOW_PROTECTED_BRANCH: 'Trabaja en feature/* y evita ramas protegidas.',
  PRE_PUSH_UPSTREAM_MISSING: 'Ejecuta: git push --set-upstream origin <branch>',
  PRE_PUSH_UPSTREAM_MISALIGNED:
    'Alinea upstream con la rama actual: git branch --unset-upstream && git push --set-upstream origin <branch>',
  MANIFEST_MUTATION_DETECTED:
    'Los hooks/gates no deben modificar manifests. Revisa wiring y ejecuta upgrade explícito solo cuando aplique (por ejemplo: pumuki update --latest).',
};

const HOOK_POLICY_RECONCILE_CODES = new Set<string>([
  'SKILLS_PLATFORM_COVERAGE_INCOMPLETE_HIGH',
  'SKILLS_SCOPE_COMPLIANCE_INCOMPLETE_HIGH',
  'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE',
  'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING',
  'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE',
]);

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
  scheduleHookGateProgressReminder: (params: {
    stage: HookStage;
    delayMs: number;
    onProgress: () => void;
  }) => () => void;
  ensureRuntimeArtifactsIgnored: (repoRoot: string) => void;
  runPolicyReconcile: typeof runPolicyReconcile;
  isPathTracked: (repoRoot: string, relativePath: string) => boolean;
  stagePath: (repoRoot: string, relativePath: string) => void;
  resolveHeadOid: (repoRoot: string) => string | null;
  resolveGitAtomicityEnforcement: () => GitAtomicityEnforcementResolution;
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
  scheduleHookGateProgressReminder: ({ delayMs, onProgress }) => {
    const timer = setTimeout(() => {
      onProgress();
    }, delayMs);
    if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
      timer.unref();
    }
    return () => {
      clearTimeout(timer);
    };
  },
  ensureRuntimeArtifactsIgnored: (repoRoot) => {
    try {
      ensureRuntimeArtifactsIgnored(repoRoot);
    } catch {
    }
  },
  runPolicyReconcile,
  isPathTracked: (repoRoot, relativePath) => {
    try {
      new GitService().runGit(['ls-files', '--error-unmatch', '--', relativePath], repoRoot);
      return true;
    } catch {
      return false;
    }
  },
  stagePath: (repoRoot, relativePath) => {
    new GitService().runGit(['add', '--', relativePath], repoRoot);
  },
  resolveHeadOid: (repoRoot) => {
    try {
      return new GitService().runGit(['rev-parse', 'HEAD'], repoRoot).trim();
    } catch {
      return null;
    }
  },
  resolveGitAtomicityEnforcement,
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

const resolvePrimaryBlockedStageFinding = (
  findings: ReadonlyArray<SnapshotFinding>
): SnapshotFinding | undefined => (
  findings.find((finding) => {
    return isSeverityAtLeast(finding.severity, 'ERROR');
  }) ?? findings[0]
);

const notifyGateBlockedForStage = (params: {
  dependencies: StageRunnerDependencies;
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  fallbackCauseCode: string;
  fallbackCauseMessage: string;
  fallbackRemediation: string;
}): void => {
  const repoRoot = params.dependencies.resolveRepoRoot();
  const evidence = params.dependencies.readEvidence(repoRoot);
  const stageFindings =
    evidence?.snapshot.stage === params.stage
      ? evidence.snapshot.findings
      : [];
  const primaryStageFinding = resolvePrimaryBlockedStageFinding(stageFindings);
  const firstViolation = evidence?.ai_gate.violations[0];
  const causeCode = primaryStageFinding?.code ?? firstViolation?.code ?? params.fallbackCauseCode;
  const causeMessage = primaryStageFinding?.message ?? firstViolation?.message ?? params.fallbackCauseMessage;
  const remediation =
    BLOCKED_REMEDIATION_BY_CODE[causeCode]
    ?? params.fallbackRemediation
    ?? DEFAULT_BLOCKED_REMEDIATION;
  params.dependencies.notifyGateBlocked({
    repoRoot,
    stage: params.stage,
    totalViolations: stageFindings.length > 0
      ? stageFindings.length
      : evidence?.ai_gate.violations.length ?? 0,
    causeCode,
    causeMessage,
    remediation,
  });
};

const isHookPolicyAutoReconcileEnabled = (): boolean =>
  process.env.PUMUKI_HOOK_POLICY_AUTO_RECONCILE !== '0';

const shouldRetryAfterPolicyReconcile = (params: {
  dependencies: StageRunnerDependencies;
  repoRoot: string;
  stage: 'PRE_COMMIT' | 'PRE_PUSH';
}): boolean => {
  const toEvidenceViolationSeverity = (violation: {
    severity?: string | null;
    level?: string | null;
  }): string => {
    if (typeof violation.severity === 'string') {
      return violation.severity;
    }
    if (typeof violation.level === 'string') {
      return violation.level;
    }
    return 'INFO';
  };
  const evidence = params.dependencies.readEvidence(params.repoRoot);
  if (!evidence) {
    return false;
  }
  const stageCodes = new Set<string>();
  if (evidence.snapshot.stage === params.stage) {
    for (const finding of evidence.snapshot.findings) {
      if (isSeverityAtLeast(finding.severity, 'ERROR')) {
        stageCodes.add(finding.code);
      }
    }
  }
  for (const violation of evidence.ai_gate.violations) {
    if (isSeverityAtLeast(toEvidenceViolationSeverity(violation), 'ERROR')) {
      stageCodes.add(violation.code);
    }
  }
  for (const code of stageCodes) {
    if (HOOK_POLICY_RECONCILE_CODES.has(code)) {
      return true;
    }
  }
  return false;
};

type HookStage = 'PRE_COMMIT' | 'PRE_PUSH';
type HookPolicyTrace = NonNullable<ReturnType<typeof resolvePolicyForStage>['trace']>;
const MANIFEST_GUARD_FILES = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
] as const;

type ManifestGuardEntry = {
  relativePath: (typeof MANIFEST_GUARD_FILES)[number];
  absolutePath: string;
  existed: boolean;
  contents: string;
};

const captureManifestGuardSnapshot = (repoRoot: string): Array<ManifestGuardEntry> =>
  MANIFEST_GUARD_FILES.map((relativePath) => {
    const absolutePath = join(repoRoot, relativePath);
    const existed = existsSync(absolutePath);
    return {
      relativePath,
      absolutePath,
      existed,
      contents: existed ? readFileSync(absolutePath, 'utf8') : '',
    };
  });

const restoreManifestGuardSnapshot = (
  snapshot: ReadonlyArray<ManifestGuardEntry>
): Array<string> => {
  const mutated: Array<string> = [];
  for (const entry of snapshot) {
    const existsNow = existsSync(entry.absolutePath);
    if (entry.existed) {
      if (!existsNow) {
        writeFileSync(entry.absolutePath, entry.contents, 'utf8');
        mutated.push(entry.relativePath);
        continue;
      }
      const current = readFileSync(entry.absolutePath, 'utf8');
      if (current !== entry.contents) {
        writeFileSync(entry.absolutePath, entry.contents, 'utf8');
        mutated.push(entry.relativePath);
      }
      continue;
    }
    if (existsNow) {
      unlinkSync(entry.absolutePath);
      mutated.push(entry.relativePath);
    }
  }
  return Array.from(new Set(mutated));
};

const enforceManifestGuard = (params: {
  dependencies: StageRunnerDependencies;
  repoRoot: string;
  stage: HookStage;
  snapshot: ReadonlyArray<ManifestGuardEntry>;
}): boolean => {
  const mutated = restoreManifestGuardSnapshot(params.snapshot);
  if (mutated.length === 0) {
    return false;
  }
  const summary = mutated.join(', ');
  process.stderr.write(
    `[pumuki][manifest-guard] unexpected manifest mutation detected and reverted: ${summary}\n`
  );
  params.dependencies.notifyGateBlocked({
    repoRoot: params.repoRoot,
    stage: params.stage,
    totalViolations: mutated.length,
    causeCode: 'MANIFEST_MUTATION_DETECTED',
    causeMessage:
      `Unexpected manifest mutation detected during ${params.stage}: ${summary}. ` +
      'Hooks/gates must not mutate consumer manifests without explicit upgrade command.',
    remediation: BLOCKED_REMEDIATION_BY_CODE.MANIFEST_MUTATION_DETECTED
      ?? DEFAULT_BLOCKED_REMEDIATION,
  });
  notifyAuditSummaryForStage(params.dependencies, params.stage);
  return true;
};

const runHookGateAttempt = async (params: {
  dependencies: StageRunnerDependencies;
  stage: HookStage;
  scope: Parameters<typeof runPlatformGate>[0]['scope'];
  sddDecisionOverride?: Pick<SddDecision, 'allowed' | 'code' | 'message'>;
}): Promise<{ exitCode: number; policyTrace: HookPolicyTrace }> => {
  const resolved = params.dependencies.resolvePolicyForStage(params.stage);
  const exitCode = await params.dependencies.runPlatformGate({
    policy: resolved.policy,
    policyTrace: resolved.trace,
    scope: params.scope,
    sddDecisionOverride: params.sddDecisionOverride,
  });
  return {
    exitCode,
    policyTrace: resolved.trace,
  };
};

const runHookGateWithPolicyRetry = async (params: {
  dependencies: StageRunnerDependencies;
  repoRoot: string;
  stage: HookStage;
  scope: Parameters<typeof runPlatformGate>[0]['scope'];
  sddDecisionOverride?: Pick<SddDecision, 'allowed' | 'code' | 'message'>;
}): Promise<{ exitCode: number; policyTrace: HookPolicyTrace }> => {
  if (!params.dependencies.isQuietMode()) {
    params.dependencies.writeHookGateSummary(
      `[pumuki][hook-gate] stage=${params.stage} decision=PENDING status=STARTED`
    );
  }
  const cancelProgressReminder = params.dependencies.isQuietMode()
    ? () => {}
    : params.dependencies.scheduleHookGateProgressReminder({
        stage: params.stage,
        delayMs: HOOK_GATE_PROGRESS_REMINDER_MS,
        onProgress: () => {
          params.dependencies.writeHookGateSummary(
            `[pumuki][hook-gate] stage=${params.stage} decision=PENDING status=RUNNING`
          );
        },
      });
  try {
    const firstAttempt = await runHookGateAttempt({
      dependencies: params.dependencies,
      stage: params.stage,
      scope: params.scope,
      sddDecisionOverride: params.sddDecisionOverride,
    });
    if (firstAttempt.exitCode === 0) {
      return firstAttempt;
    }
    if (!isHookPolicyAutoReconcileEnabled()) {
      return firstAttempt;
    }
    if (
      !shouldRetryAfterPolicyReconcile({
        dependencies: params.dependencies,
        repoRoot: params.repoRoot,
        stage: params.stage,
      })
    ) {
      return firstAttempt;
    }
    params.dependencies.runPolicyReconcile({
      dependencies: params.dependencies,
      repoRoot: params.repoRoot,
      strict: true,
      apply: true,
    });
    return runHookGateAttempt({
      dependencies: params.dependencies,
      stage: params.stage,
      scope: params.scope,
      sddDecisionOverride: params.sddDecisionOverride,
    });
  } finally {
    cancelProgressReminder();
  }
};

const syncTrackedEvidenceAfterSuccessfulPreCommit = (params: {
  dependencies: StageRunnerDependencies;
  repoRoot: string;
}): boolean => {
  const evidenceAbsolutePath = join(params.repoRoot, EVIDENCE_FILE_PATH);
  if (!existsSync(evidenceAbsolutePath)) {
    return false;
  }
  if (!params.dependencies.isPathTracked(params.repoRoot, EVIDENCE_FILE_PATH)) {
    return false;
  }
  try {
    params.dependencies.stagePath(params.repoRoot, EVIDENCE_FILE_PATH);
    return false;
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `[pumuki][evidence-sync] unable to restage tracked ${EVIDENCE_FILE_PATH}: ${details}\n`
    );
    params.dependencies.notifyGateBlocked({
      repoRoot: params.repoRoot,
      stage: 'PRE_COMMIT',
      totalViolations: 1,
      causeCode: 'EVIDENCE_STAGE_SYNC_FAILED',
      causeMessage:
        `Unable to restage tracked ${EVIDENCE_FILE_PATH} after successful PRE_COMMIT gate.`,
      remediation: BLOCKED_REMEDIATION_BY_CODE.EVIDENCE_STAGE_SYNC_FAILED
        ?? DEFAULT_BLOCKED_REMEDIATION,
    });
    notifyAuditSummaryForStage(params.dependencies, 'PRE_COMMIT');
    return true;
  }
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

const resolveExplicitPrePushRange = (
  rawInput: string
): { fromRef: string; toRef: string } | undefined => {
  const lines = rawInput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const eligibleRanges = lines
    .map((line) => {
      const [localRef, localOid, remoteRef, remoteOid] = line.split(/\s+/);
      if (!localRef || !localOid || !remoteRef || !remoteOid) {
        return undefined;
      }
      const localIsDeletion = ZERO_HASH.test(localOid);
      const remoteIsNewBranch = ZERO_HASH.test(remoteOid);
      if (localIsDeletion || remoteIsNewBranch) {
        return undefined;
      }
      return {
        fromRef: remoteOid,
        toRef: localOid,
      };
    })
    .filter((value): value is { fromRef: string; toRef: string } => Boolean(value));

  if (eligibleRanges.length !== 1) {
    return undefined;
  }

  return eligibleRanges[0];
};

const resolveHistoricalPrePushSddOverride = (params: {
  dependencies: StageRunnerDependencies;
  repoRoot: string;
  explicitPrePushRange?: { fromRef: string; toRef: string };
}): Pick<SddDecision, 'allowed' | 'code' | 'message'> | undefined => {
  const explicitRange = params.explicitPrePushRange;
  if (!explicitRange) {
    return undefined;
  }
  const headOid = params.dependencies.resolveHeadOid(params.repoRoot);
  if (!headOid || explicitRange.toRef === headOid) {
    return undefined;
  }
  return {
    allowed: true,
    code: 'ALLOWED',
    message:
      `SDD enforcement suspended for PRE_PUSH historical publish targeting ${explicitRange.toRef.slice(0, 12)} ` +
      `instead of current HEAD ${headOid.slice(0, 12)}.`,
  };
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
  const enforcement = params.dependencies.resolveGitAtomicityEnforcement();
  if (!atomicity.enabled || atomicity.allowed || !enforcement.blocking) {
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
  const manifestSnapshot = captureManifestGuardSnapshot(repoRoot);
  activeDependencies.ensureRuntimeArtifactsIgnored(repoRoot);
  if (
    enforceGitAtomicityGate({
      dependencies: activeDependencies,
      repoRoot,
      stage: 'PRE_COMMIT',
    })
  ) {
    return 1;
  }
  const result = await runHookGateWithPolicyRetry({
    dependencies: activeDependencies,
    repoRoot,
    stage: 'PRE_COMMIT',
    scope: {
      kind: 'staged',
    },
  });
  if (
    enforceManifestGuard({
      dependencies: activeDependencies,
      repoRoot,
      stage: 'PRE_COMMIT',
      snapshot: manifestSnapshot,
    })
  ) {
    return 1;
  }
  if (
    result.exitCode === 0 &&
    syncTrackedEvidenceAfterSuccessfulPreCommit({
      dependencies: activeDependencies,
      repoRoot,
    })
  ) {
    return 1;
  }
  emitSuccessfulHookGateSummary({
    dependencies: activeDependencies,
    stage: 'PRE_COMMIT',
    policyTrace: result.policyTrace,
    exitCode: result.exitCode,
  });
  if (result.exitCode !== 0) {
    notifyGateBlockedForStage({
      dependencies: activeDependencies,
      stage: 'PRE_COMMIT',
      fallbackCauseCode: 'PRE_COMMIT_GATE_BLOCKED',
      fallbackCauseMessage: 'Gate blocked pre-commit stage.',
      fallbackRemediation: DEFAULT_BLOCKED_REMEDIATION,
    });
  }
  notifyAuditSummaryForStage(activeDependencies, 'PRE_COMMIT');
  return result.exitCode;
}

export async function runPrePushStage(
  dependencies: Partial<StageRunnerDependencies> = {}
): Promise<number> {
  const activeDependencies = getDependencies(dependencies);
  const repoRoot = activeDependencies.resolveRepoRoot();
  const manifestSnapshot = captureManifestGuardSnapshot(repoRoot);
  activeDependencies.ensureRuntimeArtifactsIgnored(repoRoot);
  const prePushInput = activeDependencies.readPrePushStdin();
  const upstreamRef = activeDependencies.resolveUpstreamRef();
  if (!upstreamRef) {
    const bootstrapBaseRef = activeDependencies.resolvePrePushBootstrapBaseRef();
    const bootstrapByPrePushStdIn = shouldAllowBootstrapPrePush(prePushInput);
    const bootstrapByFallbackBase = !bootstrapByPrePushStdIn && bootstrapBaseRef !== 'HEAD';
    const manualInvocationFallback =
      !bootstrapByPrePushStdIn &&
      !bootstrapByFallbackBase &&
      prePushInput.trim().length === 0;
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
      const result = await runHookGateWithPolicyRetry({
        dependencies: activeDependencies,
        repoRoot,
        stage: 'PRE_PUSH',
        scope: {
          kind: 'range',
          fromRef: bootstrapBaseRef,
          toRef: 'HEAD',
        },
      });
      if (
        enforceManifestGuard({
          dependencies: activeDependencies,
          repoRoot,
          stage: 'PRE_PUSH',
          snapshot: manifestSnapshot,
        })
      ) {
        return 1;
      }
      emitSuccessfulHookGateSummary({
        dependencies: activeDependencies,
        stage: 'PRE_PUSH',
        policyTrace: result.policyTrace,
        exitCode: result.exitCode,
      });
      notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
      return result.exitCode;
    }
    if (manualInvocationFallback) {
      process.stderr.write(`${PRE_PUSH_MANUAL_FALLBACK_MESSAGE}\n`);
      const result = await runHookGateWithPolicyRetry({
        dependencies: activeDependencies,
        repoRoot,
        stage: 'PRE_PUSH',
        scope: {
          kind: 'workingTree',
        },
      });
      if (
        enforceManifestGuard({
          dependencies: activeDependencies,
          repoRoot,
          stage: 'PRE_PUSH',
          snapshot: manifestSnapshot,
        })
      ) {
        return 1;
      }
      emitSuccessfulHookGateSummary({
        dependencies: activeDependencies,
        stage: 'PRE_PUSH',
        policyTrace: result.policyTrace,
        exitCode: result.exitCode,
      });
      notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
      return result.exitCode;
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

  const explicitPrePushRange = resolveExplicitPrePushRange(prePushInput);
  const prePushFromRef = explicitPrePushRange?.fromRef ?? upstreamRef;
  const prePushToRef = explicitPrePushRange?.toRef ?? 'HEAD';
  const historicalPrePushSddOverride = resolveHistoricalPrePushSddOverride({
    dependencies: activeDependencies,
    repoRoot,
    explicitPrePushRange,
  });

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
      fromRef: prePushFromRef,
      toRef: prePushToRef,
    })
  ) {
    return 1;
  }

  const result = await runHookGateWithPolicyRetry({
    dependencies: activeDependencies,
    repoRoot,
    stage: 'PRE_PUSH',
    scope: {
      kind: 'range',
      fromRef: prePushFromRef,
      toRef: prePushToRef,
    },
    sddDecisionOverride: historicalPrePushSddOverride,
  });
  if (
    enforceManifestGuard({
      dependencies: activeDependencies,
      repoRoot,
      stage: 'PRE_PUSH',
      snapshot: manifestSnapshot,
    })
  ) {
    return 1;
  }
  emitSuccessfulHookGateSummary({
    dependencies: activeDependencies,
    stage: 'PRE_PUSH',
    policyTrace: result.policyTrace,
    exitCode: result.exitCode,
  });
  if (result.exitCode !== 0) {
    notifyGateBlockedForStage({
      dependencies: activeDependencies,
      stage: 'PRE_PUSH',
      fallbackCauseCode: 'PRE_PUSH_GATE_BLOCKED',
      fallbackCauseMessage: 'Gate blocked pre-push stage.',
      fallbackRemediation: DEFAULT_BLOCKED_REMEDIATION,
    });
  }
  notifyAuditSummaryForStage(activeDependencies, 'PRE_PUSH');
  return result.exitCode;
}

export async function runCiStage(
  dependencies: Partial<StageRunnerDependencies> = {}
): Promise<number> {
  const activeDependencies = getDependencies(dependencies);
  const repoRoot = activeDependencies.resolveRepoRoot();
  activeDependencies.ensureRuntimeArtifactsIgnored(repoRoot);
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
