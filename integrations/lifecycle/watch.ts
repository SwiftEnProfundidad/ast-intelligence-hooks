import { createHash } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as sleepTimer } from 'node:timers/promises';
import { isSeverityAtLeast, type Severity } from '../../core/rules/Severity';
import type { GateScope } from '../git/runPlatformGateFacts';
import { runPlatformGate } from '../git/runPlatformGate';
import { resolveFactsForGateScope } from '../git/runPlatformGateFacts';
import { resolvePolicyForStage, type ResolvedStagePolicy } from '../gate/stagePolicies';
import { readEvidence } from '../evidence/readEvidence';
import type { AiEvidenceV2_1, SnapshotFinding } from '../evidence/schema';
import { GitService, type IGitService } from '../git/GitService';
import type { Fact } from '../../core/facts/Fact';
import {
  evaluateGitAtomicity,
  type GitAtomicityEvaluation,
  type GitAtomicityViolation,
} from '../git/gitAtomicity';
import {
  resolveCiBaseRef,
  resolvePrePushBootstrapBaseRef,
  resolveUpstreamRef,
} from '../git/resolveGitRefs';
import { ensureRuntimeArtifactsIgnored } from './artifacts';
import {
  emitAuditSummaryNotificationFromEvidence,
  emitGateBlockedNotification,
} from '../notifications/emitAuditSummaryNotification';
import { runPolicyReconcile } from './policyReconcile';
import {
  buildLifecycleAlignmentCommand,
  resolvePumukiVersionMetadata,
  type PumukiVersionMetadata,
} from './packageInfo';
import {
  resolveGitAtomicityEnforcement,
  type GitAtomicityEnforcementResolution,
} from '../policy/gitAtomicityEnforcement';

export type LifecycleWatchStage = 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
export type LifecycleWatchScope = 'workingTree' | 'staged' | 'repoAndStaged' | 'repo';
export type LifecycleWatchSeverityThreshold = 'critical' | 'high' | 'medium' | 'low';

export type LifecycleWatchTickResult = {
  tick: number;
  changed: boolean;
  evaluated: boolean;
  stage: LifecycleWatchStage;
  scope: LifecycleWatchScope;
  gateExitCode: number | null;
  gateOutcome: 'BLOCK' | 'WARN' | 'ALLOW' | 'NO_EVIDENCE';
  threshold: LifecycleWatchSeverityThreshold;
  thresholdSeverity: Severity;
  totalFindings: number;
  findingsAtOrAboveThreshold: number;
  topCodes: ReadonlyArray<string>;
  changedFiles: ReadonlyArray<string>;
  evaluatedFiles: ReadonlyArray<string>;
  notification:
    | 'sent'
    | 'disabled'
    | 'below-threshold'
    | 'suppressed-cooldown'
    | 'suppressed-duplicate'
    | 'not-delivered'
    | 'not-evaluated';
  notificationDeliveryReason?: string;
};

export type LifecycleWatchResult = {
  command: 'pumuki watch';
  repoRoot: string;
  version: {
    effective: string;
    runtime: string;
    consumerInstalled: string | null;
    source: PumukiVersionMetadata['source'];
    driftFromRuntime: boolean;
    driftWarning: string | null;
    alignmentCommand: string | null;
  };
  stage: LifecycleWatchStage;
  scope: LifecycleWatchScope;
  intervalMs: number;
  notifyCooldownMs: number;
  severityThreshold: LifecycleWatchSeverityThreshold;
  notifyEnabled: boolean;
  ticks: number;
  evaluations: number;
  notificationsSent: number;
  notificationsSuppressed: number;
  lastTick: LifecycleWatchTickResult;
};

type LifecycleWatchDependencies = {
  resolveRepoRoot: () => string;
  readChangeToken: (repoRoot: string) => string;
  resolvePolicyForStage: (stage: LifecycleWatchStage) => ResolvedStagePolicy;
  resolveUpstreamRef: typeof resolveUpstreamRef;
  resolvePrePushBootstrapBaseRef: typeof resolvePrePushBootstrapBaseRef;
  resolveCiBaseRef: typeof resolveCiBaseRef;
  evaluateGitAtomicity: (params: {
    repoRoot: string;
    stage: LifecycleWatchStage;
    fromRef?: string;
    toRef?: string;
  }) => GitAtomicityEvaluation;
  runPlatformGate: typeof runPlatformGate;
  resolveFactsForGateScope: typeof resolveFactsForGateScope;
  readEvidence: (repoRoot: string) => AiEvidenceV2_1 | undefined;
  ensureRuntimeArtifactsIgnored: (repoRoot: string) => void;
  emitAuditSummaryNotificationFromEvidence: typeof emitAuditSummaryNotificationFromEvidence;
  emitGateBlockedNotification: typeof emitGateBlockedNotification;
  runPolicyReconcile: typeof runPolicyReconcile;
  resolvePumukiVersionMetadata: (params?: { repoRoot?: string }) => PumukiVersionMetadata;
  resolveGitAtomicityEnforcement: () => GitAtomicityEnforcementResolution;
  nowMs: () => number;
  sleep: (ms: number) => Promise<void>;
};

const defaultGitService = new GitService();

class RepoScopedGitService extends GitService implements IGitService {
  constructor(private readonly repoRoot: string) {
    super();
  }

  override runGit(args: ReadonlyArray<string>, cwd?: string): string {
    return super.runGit(args, cwd ?? this.repoRoot);
  }

  override resolveRepoRoot(): string {
    return this.repoRoot;
  }
}

const defaultDependencies: LifecycleWatchDependencies = {
  resolveRepoRoot: () => defaultGitService.resolveRepoRoot(),
  readChangeToken: (repoRoot) =>
    defaultGitService.runGit(['status', '--porcelain=v1', '--untracked-files=all'], repoRoot),
  resolvePolicyForStage: (stage) => resolvePolicyForStage(stage),
  resolveUpstreamRef,
  resolvePrePushBootstrapBaseRef,
  resolveCiBaseRef,
  evaluateGitAtomicity: (params) =>
    evaluateGitAtomicity({
      repoRoot: params.repoRoot,
      stage: params.stage,
      fromRef: params.fromRef,
      toRef: params.toRef,
    }),
  runPlatformGate,
  resolveFactsForGateScope,
  readEvidence,
  ensureRuntimeArtifactsIgnored: (repoRoot) => {
    try {
      ensureRuntimeArtifactsIgnored(repoRoot);
    } catch {
    }
  },
  emitAuditSummaryNotificationFromEvidence,
  emitGateBlockedNotification,
  runPolicyReconcile,
  resolvePumukiVersionMetadata,
  resolveGitAtomicityEnforcement,
  nowMs: () => Date.now(),
  sleep: async (ms) => {
    await sleepTimer(ms);
  },
};

const BLOCKED_REMEDIATION_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Genera evidencia y vuelve a ejecutar el gate.',
  EVIDENCE_INVALID: 'Regenera la evidencia antes de reintentar.',
  EVIDENCE_CHAIN_INVALID: 'Regenera evidencia para reparar la cadena criptográfica.',
  EVIDENCE_STALE: 'Refresca la evidencia y vuelve a intentarlo.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en esta rama y reintenta.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este repositorio.',
  PRE_PUSH_UPSTREAM_MISSING: 'Ejecuta: git push --set-upstream origin <branch>.',
  SDD_SESSION_MISSING: 'Abre sesión SDD y vuelve a intentar.',
  SDD_SESSION_INVALID: 'Refresca la sesión SDD y vuelve a intentar.',
  OPENSPEC_MISSING: 'Instala OpenSpec y reintenta la validación.',
  MCP_ENTERPRISE_RECEIPT_MISSING: 'Genera el receipt enterprise de MCP antes de continuar.',
  MANIFEST_MUTATION_DETECTED:
    'Validación no debe mutar package.json/lockfiles. Revisa wiring y realiza upgrades solo con comando explícito.',
};

const WATCH_POLICY_RECONCILE_CODES = new Set<string>([
  'SKILLS_PLATFORM_COVERAGE_INCOMPLETE_HIGH',
  'SKILLS_SCOPE_COMPLIANCE_INCOMPLETE_HIGH',
  'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE',
  'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING',
  'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE',
]);

const THRESHOLD_TO_SEVERITY: Record<LifecycleWatchSeverityThreshold, Severity> = {
  critical: 'CRITICAL',
  high: 'ERROR',
  medium: 'WARN',
  low: 'INFO',
};

const WATCH_MANIFEST_GUARD_FILES = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
] as const;

type WatchManifestGuardEntry = {
  relativePath: (typeof WATCH_MANIFEST_GUARD_FILES)[number];
  absolutePath: string;
  existed: boolean;
  contents: string;
};

const captureWatchManifestGuardSnapshot = (
  repoRoot: string
): Array<WatchManifestGuardEntry> =>
  WATCH_MANIFEST_GUARD_FILES.map((relativePath) => {
    const absolutePath = join(repoRoot, relativePath);
    const existed = existsSync(absolutePath);
    return {
      relativePath,
      absolutePath,
      existed,
      contents: existed ? readFileSync(absolutePath, 'utf8') : '',
    };
  });

const restoreWatchManifestGuardSnapshot = (
  snapshot: ReadonlyArray<WatchManifestGuardEntry>
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

const toGateScope = (scope: LifecycleWatchScope): GateScope => {
  if (scope === 'staged') {
    return { kind: 'staged' };
  }
  if (scope === 'repoAndStaged') {
    return { kind: 'repoAndStaged' };
  }
  if (scope === 'repo') {
    return { kind: 'repo' };
  }
  return { kind: 'workingTree' };
};

const toNotificationSignature = (params: {
  stage: LifecycleWatchStage;
  gateOutcome: LifecycleWatchTickResult['gateOutcome'];
  topCodes: ReadonlyArray<string>;
  matchedFindings: number;
}): string =>
  createHash('sha1')
    .update(
      `${params.stage}|${params.gateOutcome}|${params.topCodes.join(',')}|${params.matchedFindings}`,
      'utf8'
    )
    .digest('hex');

const toTopCodes = (findings: ReadonlyArray<SnapshotFinding>): ReadonlyArray<string> => {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const finding of findings) {
    if (seen.has(finding.code)) {
      continue;
    }
    seen.add(finding.code);
    codes.push(finding.code);
    if (codes.length >= 3) {
      break;
    }
  }
  return codes;
};

const toSortedUniquePaths = (paths: ReadonlyArray<string>): ReadonlyArray<string> =>
  [...new Set(paths.map((path) => path.trim()).filter((path) => path.length > 0))].sort();

const collectChangedFilesFromFacts = (facts: ReadonlyArray<Fact>): ReadonlyArray<string> =>
  toSortedUniquePaths(
    facts.filter((fact) => fact.kind === 'FileChange').map((fact) => fact.path)
  );

const collectEvaluatedFilesFromFacts = (facts: ReadonlyArray<Fact>): ReadonlyArray<string> => {
  const fromContent = toSortedUniquePaths(
    facts.filter((fact) => fact.kind === 'FileContent').map((fact) => fact.path)
  );
  if (fromContent.length > 0) {
    return fromContent;
  }
  return collectChangedFilesFromFacts(facts);
};

const resolveWatchAtomicityRange = (params: {
  stage: LifecycleWatchStage;
  scope: LifecycleWatchScope;
  dependencies: LifecycleWatchDependencies;
}): { fromRef?: string; toRef?: string } => {
  if (params.stage === 'PRE_COMMIT') {
    return {};
  }
  if (params.stage === 'CI') {
    return {
      fromRef: params.dependencies.resolveCiBaseRef(),
      toRef: 'HEAD',
    };
  }
  if (params.scope === 'workingTree') {
    return {};
  }
  const upstreamRef = params.dependencies.resolveUpstreamRef();
  if (typeof upstreamRef === 'string' && upstreamRef.trim().length > 0) {
    return {
      fromRef: upstreamRef,
      toRef: 'HEAD',
    };
  }
  const bootstrapBaseRef = params.dependencies.resolvePrePushBootstrapBaseRef();
  if (bootstrapBaseRef !== 'HEAD') {
    return {
      fromRef: bootstrapBaseRef,
      toRef: 'HEAD',
    };
  }
  return {};
};

const toAtomicitySnapshotFindings = (
  violations: ReadonlyArray<GitAtomicityViolation>,
  enforcement: GitAtomicityEnforcementResolution
): ReadonlyArray<SnapshotFinding> =>
  violations.map((violation) => ({
    ruleId: 'governance.git.atomicity',
    severity: enforcement.blocking ? 'ERROR' : 'WARN',
    code: violation.code,
    message: violation.message,
    file: '.pumuki/git-atomicity.json',
    matchedBy: 'LifecycleWatch',
    source: 'skills.backend.runtime-hygiene',
    blocking: enforcement.blocking,
    expected_fix: violation.remediation,
  }));

const toFirstCause = (params: {
  evidence: AiEvidenceV2_1 | undefined;
  matchedFindings: ReadonlyArray<SnapshotFinding>;
}): { code: string; message: string; remediation: string } => {
  const firstFinding = params.matchedFindings[0];
  const firstViolation = params.evidence?.ai_gate.violations[0];
  const code = firstFinding?.code ?? firstViolation?.code ?? 'WATCH_GATE_BLOCKED';
  const message =
    firstFinding?.message ??
    firstViolation?.message ??
    `Watch gate bloqueado (${code}).`;
  const remediation =
    BLOCKED_REMEDIATION_BY_CODE[code] ??
    'Corrige el bloqueo indicado y vuelve a evaluar.';
  return {
    code,
    message,
    remediation,
  };
};

export const runLifecycleWatch = async (
  params?: {
    repoRoot?: string;
    stage?: LifecycleWatchStage;
    scope?: LifecycleWatchScope;
    intervalMs?: number;
    notifyCooldownMs?: number;
    severityThreshold?: LifecycleWatchSeverityThreshold;
    notifyEnabled?: boolean;
    maxIterations?: number;
    onTick?: (tick: LifecycleWatchTickResult) => void;
  },
  dependencies: Partial<LifecycleWatchDependencies> = {}
): Promise<LifecycleWatchResult> => {
  const activeDependencies: LifecycleWatchDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const repoRoot = params?.repoRoot ?? activeDependencies.resolveRepoRoot();
  const repoGitService = new RepoScopedGitService(repoRoot);
  const versionMetadata = activeDependencies.resolvePumukiVersionMetadata({ repoRoot });
  const driftFromRuntime = versionMetadata.resolvedVersion !== versionMetadata.runtimeVersion;
  const driftWarning = driftFromRuntime
    ? `Version drift detectado: effective=${versionMetadata.resolvedVersion} runtime=${versionMetadata.runtimeVersion}. ` +
      'Actualiza el consumer para alinear el binario local con @latest y evitar diagnósticos inconsistentes.'
    : null;
  const stage = params?.stage ?? 'PRE_COMMIT';
  const scope = params?.scope ?? 'workingTree';
  const intervalMs = Math.max(250, Math.trunc(params?.intervalMs ?? 3000));
  const notifyCooldownMs = Math.max(0, Math.trunc(params?.notifyCooldownMs ?? 30_000));
  const severityThreshold = params?.severityThreshold ?? 'high';
  const thresholdSeverity = THRESHOLD_TO_SEVERITY[severityThreshold];
  const notifyEnabled = params?.notifyEnabled !== false;
  const autoPolicyReconcileEnabled = process.env.PUMUKI_WATCH_POLICY_AUTO_RECONCILE !== '0';
  activeDependencies.ensureRuntimeArtifactsIgnored(repoRoot);
  const maxIterations =
    typeof params?.maxIterations === 'number' && params.maxIterations > 0
      ? Math.trunc(params.maxIterations)
      : undefined;

  let ticks = 0;
  let evaluations = 0;
  let notificationsSent = 0;
  let notificationsSuppressed = 0;
  let previousChangeToken: string | undefined;
  let lastNotificationSignature: string | undefined;
  let lastNotificationAtMs = 0;
  let lastTick: LifecycleWatchTickResult = {
    tick: 0,
    changed: false,
    evaluated: false,
    stage,
    scope,
    gateExitCode: null,
    gateOutcome: 'NO_EVIDENCE',
    threshold: severityThreshold,
    thresholdSeverity,
    totalFindings: 0,
    findingsAtOrAboveThreshold: 0,
    topCodes: [],
    changedFiles: [],
    evaluatedFiles: [],
    notification: 'not-evaluated',
  };

  while (true) {
    ticks += 1;
    const changeToken = activeDependencies.readChangeToken(repoRoot);
    const changed = previousChangeToken !== changeToken;
    const shouldEvaluate = ticks === 1 || changed;

    if (!shouldEvaluate) {
      lastTick = {
        ...lastTick,
        tick: ticks,
        changed,
        evaluated: false,
        changedFiles: [],
        evaluatedFiles: [],
        notification: 'not-evaluated',
      };
      params?.onTick?.(lastTick);
    } else {
      evaluations += 1;
      const gateScope = toGateScope(scope);
      const facts = await activeDependencies.resolveFactsForGateScope({
        scope: gateScope,
        git: repoGitService,
      });
      const changedFiles = collectChangedFilesFromFacts(facts);
      const evaluatedFiles = collectEvaluatedFilesFromFacts(facts);
      const scopeHasFileDelta = changedFiles.length > 0 || evaluatedFiles.length > 0;
      const runEvaluation = async (
        resolvedPolicy: ResolvedStagePolicy
      ): Promise<{
        gateExitCode: number;
        evidence: AiEvidenceV2_1 | undefined;
        allFindings: ReadonlyArray<SnapshotFinding>;
        matchedFindings: ReadonlyArray<SnapshotFinding>;
        gateOutcome: 'BLOCK' | 'WARN' | 'ALLOW' | 'NO_EVIDENCE';
        topCodes: ReadonlyArray<string>;
      }> => {
        const atomicityRange = resolveWatchAtomicityRange({
          stage,
          scope,
          dependencies: activeDependencies,
        });
        const atomicity = activeDependencies.evaluateGitAtomicity({
          repoRoot,
          stage,
          fromRef: atomicityRange.fromRef,
          toRef: atomicityRange.toRef,
        });
        const atomicityEnforcement = activeDependencies.resolveGitAtomicityEnforcement();
        const atomicityFindings =
          atomicity.enabled && !atomicity.allowed
            ? toAtomicitySnapshotFindings(atomicity.violations, atomicityEnforcement)
            : [];
        if (atomicityFindings.length > 0 && atomicityEnforcement.blocking) {
          const allFindings = atomicityFindings;
          const matchedFindings = allFindings.filter((finding) =>
            isSeverityAtLeast(finding.severity, thresholdSeverity)
          );
          return {
            gateExitCode: 1,
            evidence: undefined,
            allFindings,
            matchedFindings,
            gateOutcome: 'BLOCK',
            topCodes: toTopCodes(matchedFindings),
          };
        }
        const manifestSnapshot = captureWatchManifestGuardSnapshot(repoRoot);
        let gateExitCode = await activeDependencies.runPlatformGate({
          policy: resolvedPolicy.policy,
          policyTrace: resolvedPolicy.trace,
          scope: gateScope,
          silent: true,
          services: {
            git: repoGitService,
          },
        });
        const evidence = activeDependencies.readEvidence(repoRoot);
        const allFindingsBase = evidence?.snapshot.findings ?? [];
        const matchedFindingsBase = allFindingsBase.filter((finding) =>
          isSeverityAtLeast(finding.severity, thresholdSeverity)
        );
        const manifestMutations = restoreWatchManifestGuardSnapshot(manifestSnapshot);
        const manifestMutationFinding: SnapshotFinding | null =
          manifestMutations.length > 0
            ? {
                ruleId: 'governance.manifest.no-silent-mutation',
                severity: 'ERROR',
                code: 'MANIFEST_MUTATION_DETECTED',
                message:
                  `Unexpected manifest mutation detected during watch and reverted: ${manifestMutations.join(', ')}.`,
                file: manifestMutations[0] ?? 'package.json',
                matchedBy: 'LifecycleWatch',
                source: 'skills.backend.runtime-hygiene',
              }
            : null;
        const allFindingsWithAtomicity = [...allFindingsBase, ...atomicityFindings];
        const matchedFindingsWithAtomicity = allFindingsWithAtomicity.filter((finding) =>
          isSeverityAtLeast(finding.severity, thresholdSeverity)
        );
        const allFindings = manifestMutationFinding
          ? [...allFindingsWithAtomicity, manifestMutationFinding]
          : allFindingsWithAtomicity;
        const matchedFindings = manifestMutationFinding
          ? [...matchedFindingsWithAtomicity, manifestMutationFinding]
          : matchedFindingsWithAtomicity;
        const rawGateOutcome =
          evidence?.snapshot.outcome ??
          (gateExitCode !== 0 ? 'BLOCK' : 'NO_EVIDENCE');
        const normalizedGateOutcome =
          rawGateOutcome === 'PASS'
            ? 'ALLOW'
            : rawGateOutcome;
        const gateOutcome = manifestMutationFinding
          ? 'BLOCK'
          : normalizedGateOutcome === 'ALLOW' && atomicityFindings.length > 0
            ? 'WARN'
            : normalizedGateOutcome;
        if (manifestMutationFinding) {
          gateExitCode = 1;
          process.stderr.write(
            `[pumuki][watch-manifest-guard] unexpected manifest mutation detected and reverted: ${manifestMutations.join(', ')}\n`
          );
        }
        const topCodes = toTopCodes(matchedFindings);
        return {
          gateExitCode,
          evidence,
          allFindings,
          matchedFindings,
          gateOutcome,
          topCodes,
        };
      };

      let evaluation = await runEvaluation(activeDependencies.resolvePolicyForStage(stage));
      if (autoPolicyReconcileEnabled && evaluation.gateExitCode !== 0) {
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
        const findingCodes = new Set<string>([
          ...evaluation.allFindings
            .filter((finding) => isSeverityAtLeast(finding.severity, 'ERROR'))
            .map((finding) => finding.code),
          ...((evaluation.evidence?.ai_gate.violations ?? [])
            .filter((violation) => isSeverityAtLeast(toEvidenceViolationSeverity(violation), 'ERROR'))
            .map((violation) => violation.code)),
        ]);
        const shouldAttemptAutoReconcile = [...findingCodes].some((code) =>
          WATCH_POLICY_RECONCILE_CODES.has(code)
        );
        if (shouldAttemptAutoReconcile) {
          const reconcile = activeDependencies.runPolicyReconcile({
            repoRoot,
            strict: true,
            apply: true,
          });
          if (reconcile.autofix.status === 'APPLIED') {
            evaluation = await runEvaluation(activeDependencies.resolvePolicyForStage(stage));
          }
        }
      }
      const {
        gateExitCode,
        evidence,
        allFindings,
        matchedFindings,
        gateOutcome,
        topCodes,
      } = evaluation;
      const signature = toNotificationSignature({
        stage,
        gateOutcome,
        topCodes,
        matchedFindings: matchedFindings.length,
      });

      let notification: LifecycleWatchTickResult['notification'] = 'below-threshold';
      let notificationDeliveryReason: string | undefined;

      if (!notifyEnabled) {
        notification = 'disabled';
      } else if (matchedFindings.length === 0) {
        notification = 'below-threshold';
      } else {
        const nowMs = activeDependencies.nowMs();
        const elapsed = nowMs - lastNotificationAtMs;
        if (
          notifyCooldownMs > 0 &&
          typeof lastNotificationSignature === 'string' &&
          elapsed < notifyCooldownMs
        ) {
          notification =
            signature === lastNotificationSignature
              ? 'suppressed-duplicate'
              : 'suppressed-cooldown';
          notificationsSuppressed += 1;
        } else {
          let notificationResult;
          if (gateExitCode !== 0 || evidence?.ai_gate.status === 'BLOCKED') {
            const cause = toFirstCause({
              evidence,
              matchedFindings,
            });
            notificationResult = activeDependencies.emitGateBlockedNotification({
              repoRoot,
              stage,
              totalViolations: matchedFindings.length,
              causeCode: cause.code,
              causeMessage: cause.message,
              remediation: cause.remediation,
            });
          } else {
            notificationResult = activeDependencies.emitAuditSummaryNotificationFromEvidence({
              repoRoot,
              stage,
            });
          }

          if (notificationResult.delivered) {
            notification = 'sent';
            notificationsSent += 1;
          } else {
            notification = 'not-delivered';
            notificationDeliveryReason = notificationResult.reason;
            notificationsSuppressed += 1;
          }
          lastNotificationAtMs = nowMs;
          lastNotificationSignature = signature;
        }
      }

      lastTick = {
        tick: ticks,
        changed: scopeHasFileDelta,
        evaluated: true,
        stage,
        scope,
        gateExitCode,
        gateOutcome,
        threshold: severityThreshold,
        thresholdSeverity,
        totalFindings: allFindings.length,
        findingsAtOrAboveThreshold: matchedFindings.length,
        topCodes,
        changedFiles,
        evaluatedFiles,
        notification,
        ...(notificationDeliveryReason
          ? { notificationDeliveryReason }
          : {}),
      };
      params?.onTick?.(lastTick);
    }

    previousChangeToken = changeToken;

    if (maxIterations && ticks >= maxIterations) {
      return {
        command: 'pumuki watch',
        repoRoot,
        version: {
          effective: versionMetadata.resolvedVersion,
          runtime: versionMetadata.runtimeVersion,
          consumerInstalled: versionMetadata.consumerInstalledVersion,
          source: versionMetadata.source,
          driftFromRuntime,
          driftWarning,
          alignmentCommand: driftFromRuntime
            ? buildLifecycleAlignmentCommand(versionMetadata.runtimeVersion)
            : null,
        },
        stage,
        scope,
        intervalMs,
        notifyCooldownMs,
        severityThreshold,
        notifyEnabled,
        ticks,
        evaluations,
        notificationsSent,
        notificationsSuppressed,
        lastTick,
      };
    }

    await activeDependencies.sleep(intervalMs);
  }
};
