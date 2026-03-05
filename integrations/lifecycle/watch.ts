import { createHash } from 'node:crypto';
import { setTimeout as sleepTimer } from 'node:timers/promises';
import { isSeverityAtLeast, type Severity } from '../../core/rules/Severity';
import type { GateScope } from '../git/runPlatformGateFacts';
import { runPlatformGate } from '../git/runPlatformGate';
import { resolvePolicyForStage, type ResolvedStagePolicy } from '../gate/stagePolicies';
import { readEvidence } from '../evidence/readEvidence';
import type { AiEvidenceV2_1, SnapshotFinding } from '../evidence/schema';
import { GitService } from '../git/GitService';
import {
  emitAuditSummaryNotificationFromEvidence,
  emitGateBlockedNotification,
} from '../notifications/emitAuditSummaryNotification';

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
  runPlatformGate: typeof runPlatformGate;
  readEvidence: (repoRoot: string) => AiEvidenceV2_1 | undefined;
  emitAuditSummaryNotificationFromEvidence: typeof emitAuditSummaryNotificationFromEvidence;
  emitGateBlockedNotification: typeof emitGateBlockedNotification;
  nowMs: () => number;
  sleep: (ms: number) => Promise<void>;
};

const defaultGitService = new GitService();

const defaultDependencies: LifecycleWatchDependencies = {
  resolveRepoRoot: () => defaultGitService.resolveRepoRoot(),
  readChangeToken: (repoRoot) =>
    defaultGitService.runGit(['status', '--porcelain=v1', '--untracked-files=all'], repoRoot),
  resolvePolicyForStage: (stage) => resolvePolicyForStage(stage),
  runPlatformGate,
  readEvidence,
  emitAuditSummaryNotificationFromEvidence,
  emitGateBlockedNotification,
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
};

const THRESHOLD_TO_SEVERITY: Record<LifecycleWatchSeverityThreshold, Severity> = {
  critical: 'CRITICAL',
  high: 'ERROR',
  medium: 'WARN',
  low: 'INFO',
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
  const stage = params?.stage ?? 'PRE_COMMIT';
  const scope = params?.scope ?? 'workingTree';
  const intervalMs = Math.max(250, Math.trunc(params?.intervalMs ?? 3000));
  const notifyCooldownMs = Math.max(0, Math.trunc(params?.notifyCooldownMs ?? 30_000));
  const severityThreshold = params?.severityThreshold ?? 'high';
  const thresholdSeverity = THRESHOLD_TO_SEVERITY[severityThreshold];
  const notifyEnabled = params?.notifyEnabled !== false;
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
        notification: 'not-evaluated',
      };
      params?.onTick?.(lastTick);
    } else {
      evaluations += 1;
      const resolvedPolicy = activeDependencies.resolvePolicyForStage(stage);
      const gateExitCode = await activeDependencies.runPlatformGate({
        policy: resolvedPolicy.policy,
        policyTrace: resolvedPolicy.trace,
        scope: toGateScope(scope),
      });
      const evidence = activeDependencies.readEvidence(repoRoot);
      const allFindings = evidence?.snapshot.findings ?? [];
      const matchedFindings = allFindings.filter((finding) =>
        isSeverityAtLeast(finding.severity, thresholdSeverity)
      );
      const rawGateOutcome =
        evidence?.snapshot.outcome ??
        (gateExitCode !== 0 ? 'BLOCK' : 'NO_EVIDENCE');
      const gateOutcome =
        rawGateOutcome === 'PASS' ? 'ALLOW' : rawGateOutcome;
      const topCodes = toTopCodes(matchedFindings);
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
        changed,
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
