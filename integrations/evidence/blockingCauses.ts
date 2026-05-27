import type { AiEvidenceV2_1, CompatibilityViolation, SnapshotFinding } from './schema';

export type EvidenceBlockingCause = {
  ruleId: string;
  code: string;
  severity: string;
  message: string;
  file?: string;
  lines?: SnapshotFinding['lines'];
  remediation?: string;
  source: 'snapshot.findings' | 'ai_gate.violations';
};

const isBlockingSeverity = (severity: string): boolean =>
  severity.toUpperCase() === 'CRITICAL' || severity.toUpperCase() === 'ERROR';

const isNonBlockingSwiftTestingMigrationWarning = (params: {
  ruleId?: string;
  severity: string;
}): boolean =>
  params.ruleId === 'skills.ios.prefer-swift-testing'
  && params.severity.toUpperCase() === 'WARN';

const toFindingBlockingCause = (finding: SnapshotFinding): EvidenceBlockingCause => ({
  ruleId: finding.ruleId,
  code: finding.code,
  severity: finding.severity,
  message: finding.message,
  file: finding.file,
  lines: finding.lines,
  remediation: finding.expected_fix,
  source: 'snapshot.findings',
});

const toViolationBlockingCause = (
  violation: CompatibilityViolation
): EvidenceBlockingCause => {
  const withStructuredRemediation = violation as CompatibilityViolation & { remediation?: string };
  return {
    ruleId: violation.ruleId,
    code: violation.code,
    severity: resolveViolationSeverity(violation),
    message: violation.message,
    file: violation.file,
    lines: violation.lines,
    remediation: violation.expected_fix ?? withStructuredRemediation.remediation,
    source: 'ai_gate.violations',
  };
};

const resolveViolationSeverity = (violation: CompatibilityViolation): string => {
  const withLegacySeverity = violation as CompatibilityViolation & { severity?: string };
  return typeof violation.level === 'string'
    ? violation.level
    : withLegacySeverity.severity ?? 'ERROR';
};

const causeKey = (cause: EvidenceBlockingCause): string =>
  [cause.ruleId, cause.code, cause.file ?? '', String(cause.lines ?? '')].join('|');

export const extractEvidenceBlockingCauses = (
  evidence: AiEvidenceV2_1
): ReadonlyArray<EvidenceBlockingCause> => {
  const causes: EvidenceBlockingCause[] = [];
  const seen = new Set<string>();

  for (const finding of evidence.snapshot.findings) {
    const explicitlyBlocking = finding.blocking === true;
    if (
      finding.blocking === false
      || isNonBlockingSwiftTestingMigrationWarning({
        ruleId: finding.ruleId,
        severity: finding.severity,
      })
      || (!explicitlyBlocking && !isBlockingSeverity(finding.severity))
    ) {
      continue;
    }
    const cause = toFindingBlockingCause(finding);
    const key = causeKey(cause);
    if (!seen.has(key)) {
      causes.push(cause);
      seen.add(key);
    }
  }

  for (const violation of evidence.ai_gate.violations) {
    const explicitlyBlocking = violation.blocking === true;
    const severity = resolveViolationSeverity(violation);
    if (
      violation.blocking === false ||
      isNonBlockingSwiftTestingMigrationWarning({
        ruleId: violation.ruleId,
        severity,
      }) ||
      (!explicitlyBlocking && !isBlockingSeverity(severity))
    ) {
      continue;
    }
    const cause = toViolationBlockingCause(violation);
    const key = causeKey(cause);
    if (!seen.has(key)) {
      causes.push(cause);
      seen.add(key);
    }
  }

  return causes;
};

export const formatEvidenceBlockingCause = (cause: EvidenceBlockingCause): string => {
  const location = cause.file ? ` file=${cause.file}` : '';
  const lines = cause.lines ? ` lines=${String(cause.lines)}` : '';
  const remediation = cause.remediation ? ` remediation=${cause.remediation}` : '';
  return `${cause.ruleId} severity=${cause.severity} code=${cause.code}${location}${lines} message=${cause.message}${remediation}`;
};
