import type { AiEvidenceV2_1 } from '../evidence/schema';
import { readEvidence } from '../evidence/readEvidence';
import {
  extractEvidenceBlockingCauses,
  formatEvidenceBlockingCause,
} from '../evidence/blockingCauses';
import type { AiGateCheckResult } from '../gate/evaluateAiGate';
import { appendTrackingActionableContext } from '../git/aiGateRepoPolicyFindings';
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

type NotificationBlockingCause = {
  code: string;
  message: string;
  ruleId?: string;
  file?: string;
  line?: number;
  lines?: ReadonlyArray<number>;
  remediation?: string;
};

const defaultDependencies: AuditSummaryNotificationDependencies = {
  readEvidence,
  emitSystemNotification,
  env: process.env,
};

const isTruthyEnvValue = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const withTrackingContext = (params: {
  repoRoot: string;
  causeMessage: string;
}): string => {
  if (
    params.causeMessage.includes('active_entries=') ||
    params.causeMessage.includes('tracking_source=')
  ) {
    return params.causeMessage;
  }
  return appendTrackingActionableContext({
    repoRoot: params.repoRoot,
    message: params.causeMessage,
  });
};

const normalizeNotificationStage = (stage: string): PumukiNotificationStage => {
  if (stage === 'PRE_WRITE' || stage === 'PRE_COMMIT' || stage === 'PRE_PUSH' || stage === 'CI') {
    return stage;
  }
  return 'PRE_COMMIT';
};

const normalizeRuleCode = (ruleId: string): string =>
  ruleId
    .replace(/^skills\./u, 'SKILLS_')
    .replace(/[.-]/gu, '_')
    .toUpperCase();

const extractMessageField = (message: string, field: string): string | undefined => {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = message.match(new RegExp(`\\b${escapedField}=([^\\n]+?)(?=\\s(?:severity|code|rule|file|lines?|message|remediation|snippet|node|primary_node|missing)=|\\s\\|\\|\\s\\d+\\)|$)`, 'i'));
  const value = match?.[1]?.trim();
  return value && value.length > 0 ? value : undefined;
};

const normalizeEvidenceLinesForNotification = (
  lines: unknown
): Pick<NotificationBlockingCause, 'line' | 'lines'> => {
  if (typeof lines === 'number' && Number.isFinite(lines) && lines > 0) {
    return {
      line: Math.floor(lines),
    };
  }
  if (Array.isArray(lines)) {
    const normalized = Array.from(
      new Set(
        lines
          .filter((line): line is number => typeof line === 'number' && Number.isFinite(line) && line > 0)
          .map((line) => Math.floor(line))
      )
    ).sort((left, right) => left - right);
    return normalized.length > 0 ? { lines: normalized } : {};
  }
  if (typeof lines === 'string') {
    const normalized = Array.from(
      new Set(
        lines
          .split(',')
          .map((line) => Number.parseInt(line.trim(), 10))
          .filter((line) => Number.isFinite(line) && line > 0)
      )
    ).sort((left, right) => left - right);
    return normalized.length > 0 ? { lines: normalized } : {};
  }
  return {};
};

const extractStructuredLinesFromMessage = (
  message: string
): Pick<NotificationBlockingCause, 'line' | 'lines'> => {
  const raw = message.match(/\blines?=([0-9][0-9,\-\s]*)\b/i)?.[1];
  if (!raw) {
    return {};
  }
  return normalizeEvidenceLinesForNotification(raw);
};

const extractFirstNestedSkillSegment = (message: string): string =>
  message
    .replace(/^.*?\bBlocking causes:\s*1\)\s*/isu, '')
    .replace(/\s+\|\|\s+\d+\)\s+[\s\S]*$/u, '')
    .trim();

const normalizeNestedSkillMessage = (params: {
  ruleId: string;
  segment: string;
}): string => {
  if (/\bmessage=/i.test(params.segment)) {
    return params.segment;
  }
  const withoutRule = params.segment.replace(params.ruleId, '').trim();
  return `message=${withoutRule || 'Skill violada.'}`;
};

const extractNestedSkillCauseFromWrapper = (cause: NotificationBlockingCause): NotificationBlockingCause => {
  if (cause.ruleId?.startsWith('skills.') || cause.code.startsWith('SKILLS_')) {
    return cause;
  }
  const nested = cause.message.match(/\bBlocking causes:\s*1\)\s*(skills\.[a-z0-9_.-]+)\s+(.+?)$/isu);
  if (!nested?.[1]) {
    return cause;
  }
  const ruleId = nested[1];
  const nestedMessage = extractFirstNestedSkillSegment(cause.message) || nested[2]?.trim() || 'Skill violada.';
  const normalizedNestedMessage = normalizeNestedSkillMessage({
    ruleId,
    segment: nestedMessage,
  });
  const nestedFile = extractMessageField(normalizedNestedMessage, 'file');
  const nestedRemediation = extractMessageField(normalizedNestedMessage, 'remediation');
  return {
    ...cause,
    code: normalizeRuleCode(ruleId),
    ruleId,
    file: nestedFile ?? cause.file,
    ...(
      cause.line || cause.lines
        ? {}
        : extractStructuredLinesFromMessage(normalizedNestedMessage)
    ),
    message: `rule=${ruleId} ${normalizedNestedMessage}`,
    remediation:
      cause.remediation && !/corrige la violaci[oó]n indicada|corrige la causa bloqueante/i.test(cause.remediation)
        ? cause.remediation
        : nestedRemediation ?? 'Corrige la violación de la skill indicada en el fichero afectado y vuelve a intentar el commit.',
  };
};

const normalizeNotificationBlockingCause = (
  cause: NotificationBlockingCause
): NotificationBlockingCause => extractNestedSkillCauseFromWrapper(cause);

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
  const blockingCauses = extractEvidenceBlockingCauses(evidence);
  if (blockingCauses.length > 0) {
    const primaryCause = blockingCauses[0]!;
    return {
      kind: 'gate.blocked',
      stage: normalizeNotificationStage(evidence.snapshot.stage),
      totalViolations: evidence.severity_metrics.total_violations,
      causeCode: primaryCause.code,
      causeMessage: formatEvidenceBlockingCause(primaryCause),
      remediation: primaryCause.remediation ?? 'Corrige la violación indicada y vuelve a intentar el commit.',
      blockingCauses: blockingCauses.map((cause) =>
        normalizeNotificationBlockingCause({
          code: cause.code,
          ruleId: cause.ruleId,
          file: cause.file,
          ...normalizeEvidenceLinesForNotification(cause.lines),
          message: formatEvidenceBlockingCause(cause),
          remediation: cause.remediation,
        })
      ),
    };
  }
  return {
    kind: 'audit.summary',
    totalViolations: evidence.severity_metrics.total_violations,
    criticalViolations: enterpriseSeverity?.CRITICAL ?? severity.CRITICAL ?? 0,
    highViolations: enterpriseSeverity?.HIGH ?? severity.ERROR ?? 0,
  };
};

export const toAuditSummaryEventFromAiGate = (params: {
  aiGateResult: Pick<AiGateCheckResult, 'violations'>;
  stage?: PumukiNotificationStage;
}): PumukiCriticalNotificationEvent => {
  const criticalViolations = params.aiGateResult.violations.reduce(
    (total, violation) => (violation.severity === 'ERROR' ? total + 1 : total),
    0
  );
  const highViolations = params.aiGateResult.violations.reduce(
    (total, violation) => (violation.severity === 'WARN' ? total + 1 : total),
    0
  );
  if (params.aiGateResult.violations.length > 0) {
    const primaryViolation = params.aiGateResult.violations[0]!;
    return {
      kind: 'gate.blocked',
      stage: params.stage ?? 'PRE_WRITE',
      totalViolations: params.aiGateResult.violations.length,
      causeCode: primaryViolation.code,
      causeMessage: primaryViolation.message,
      remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
      blockingCauses: params.aiGateResult.violations.map((violation) =>
        normalizeNotificationBlockingCause({
          code: violation.code,
          ruleId: violation.code.startsWith('skills.') ? violation.code : undefined,
          message: violation.message,
          remediation: 'Corrige la violación indicada y vuelve a intentar el commit.',
          ...extractStructuredLinesFromMessage(violation.message),
        })
      ),
    };
  }
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
    stage: params.stage,
  });
  return activeDependencies.emitSystemNotification({
    event,
    repoRoot: params.repoRoot,
  });
};

export const emitGateBlockedNotification = (
  params: {
    repoRoot: string;
    stage: AuditSummaryNotificationStage;
    totalViolations: number;
    causeCode: string;
    causeMessage: string;
    remediation: string;
    blockingCauses?: ReadonlyArray<{
      code: string;
      message: string;
      ruleId?: string;
      file?: string;
      remediation?: string;
    }>;
  },
  dependencies: Partial<AuditSummaryNotificationDependencies> = {}
): SystemNotificationEmitResult => {
  const activeDependencies: AuditSummaryNotificationDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  return activeDependencies.emitSystemNotification({
    event: {
      kind: 'gate.blocked',
      stage: params.stage,
      totalViolations: params.totalViolations,
      causeCode: params.causeCode,
      causeMessage: withTrackingContext({
        repoRoot: params.repoRoot,
        causeMessage: params.causeMessage,
      }),
      remediation: params.remediation,
      blockingCauses: params.blockingCauses?.map(normalizeNotificationBlockingCause),
    },
    repoRoot: params.repoRoot,
  });
};
