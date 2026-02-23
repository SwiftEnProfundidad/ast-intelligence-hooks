import type { AiEvidenceV2_1 } from '../evidence/schema';
import { readEvidence } from '../evidence/readEvidence';
import type { AiGateCheckResult } from '../gate/evaluateAiGate';
import {
  emitSystemNotification,
  type PumukiCriticalNotificationEvent,
  type PumukiNotificationStage,
  type SystemNotificationEmitResult,
} from '../../scripts/framework-menu-system-notifications-lib';

export type AuditSummaryNotificationStage = PumukiNotificationStage;

export type AuditSummaryNotificationResult =
  | SystemNotificationEmitResult
  | { delivered: false; reason: 'missing-evidence' | 'ci-disabled' };

type AuditSummaryNotificationDependencies = {
  readEvidence: typeof readEvidence;
  emitSystemNotification: typeof emitSystemNotification;
  env: NodeJS.ProcessEnv;
};

const defaultDependencies: AuditSummaryNotificationDependencies = {
  readEvidence,
  emitSystemNotification,
  env: process.env,
};

const isTruthyEnvValue = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

export const shouldEmitAuditSummaryNotificationForStage = (
  stage: AuditSummaryNotificationStage,
  env: NodeJS.ProcessEnv = process.env
): boolean => {
  if (stage !== 'CI') {
    return true;
  }
  return isTruthyEnvValue(env.PUMUKI_NOTIFY_CI);
};

export const toAuditSummaryEventFromEvidence = (
  evidence: AiEvidenceV2_1
): PumukiCriticalNotificationEvent => {
  const enterpriseSeverity = evidence.severity_metrics.by_enterprise_severity;
  const severity = evidence.severity_metrics.by_severity;
  return {
    kind: 'audit.summary',
    totalViolations: evidence.severity_metrics.total_violations,
    criticalViolations: enterpriseSeverity?.CRITICAL ?? severity.CRITICAL ?? 0,
    highViolations: enterpriseSeverity?.HIGH ?? severity.ERROR ?? 0,
  };
};

export const toAuditSummaryEventFromAiGate = (params: {
  aiGateResult: Pick<AiGateCheckResult, 'violations'>;
}): PumukiCriticalNotificationEvent => {
  const criticalViolations = params.aiGateResult.violations.reduce(
    (total, violation) => (violation.severity === 'ERROR' ? total + 1 : total),
    0
  );
  const highViolations = params.aiGateResult.violations.reduce(
    (total, violation) => (violation.severity === 'WARN' ? total + 1 : total),
    0
  );
  return {
    kind: 'audit.summary',
    totalViolations: params.aiGateResult.violations.length,
    criticalViolations,
    highViolations,
  };
};

export const emitAuditSummaryNotificationFromEvidence = (
  params: {
    repoRoot: string;
    stage: AuditSummaryNotificationStage;
  },
  dependencies: Partial<AuditSummaryNotificationDependencies> = {}
): AuditSummaryNotificationResult => {
  const activeDependencies: AuditSummaryNotificationDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  if (!shouldEmitAuditSummaryNotificationForStage(params.stage, activeDependencies.env)) {
    return {
      delivered: false,
      reason: 'ci-disabled',
    };
  }
  const evidence = activeDependencies.readEvidence(params.repoRoot);
  if (!evidence) {
    return {
      delivered: false,
      reason: 'missing-evidence',
    };
  }
  const event = toAuditSummaryEventFromEvidence(evidence);
  return activeDependencies.emitSystemNotification({
    event,
    repoRoot: params.repoRoot,
  });
};

export const emitAuditSummaryNotificationFromAiGate = (
  params: {
    repoRoot: string;
    stage: AuditSummaryNotificationStage;
    aiGateResult: Pick<AiGateCheckResult, 'violations'>;
  },
  dependencies: Partial<AuditSummaryNotificationDependencies> = {}
): AuditSummaryNotificationResult => {
  const activeDependencies: AuditSummaryNotificationDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  if (!shouldEmitAuditSummaryNotificationForStage(params.stage, activeDependencies.env)) {
    return {
      delivered: false,
      reason: 'ci-disabled',
    };
  }
  const event = toAuditSummaryEventFromAiGate({
    aiGateResult: params.aiGateResult,
  });
  return activeDependencies.emitSystemNotification({
    event,
    repoRoot: params.repoRoot,
  });
};
