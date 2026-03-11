import type {
  GateSeverity,
  LegacySeverity,
} from './framework-menu-legacy-audit-types';
import type { NormalizedFinding } from './framework-menu-legacy-audit-summary-types';

export const computePatternChecks = (findings: ReadonlyArray<NormalizedFinding>) => {
  const contains = (needle: string, finding: NormalizedFinding): boolean =>
    finding.ruleId.toLowerCase().includes(needle);

  return {
    todoFixme: findings.filter((finding) => contains('todo', finding) || contains('fixme', finding)).length,
    consoleLog: findings.filter((finding) => contains('console', finding)).length,
    anyType: findings.filter((finding) => contains('any', finding)).length,
    sqlRaw: findings.filter((finding) => contains('sql', finding)).length,
  };
};

export const computeEslintCounts = (findings: ReadonlyArray<NormalizedFinding>) => {
  const eslintFindings = findings.filter((finding) =>
    finding.ruleId.toLowerCase().startsWith('eslint.')
    || finding.ruleId.toLowerCase().includes('.eslint.')
  );
  return {
    errors: eslintFindings.filter((finding) => finding.severity === 'CRITICAL' || finding.severity === 'ERROR').length,
    warnings: eslintFindings.filter((finding) => finding.severity === 'WARN' || finding.severity === 'INFO').length,
  };
};

export const computeCodeHealthScore = (
  severity: Record<LegacySeverity, number>,
  filesScanned: number,
  totalViolations: number
): number => {
  const safeFilesScanned = Math.max(1, Math.trunc(filesScanned));
  const weightedSeverity = (
    (severity.CRITICAL * 20) +
    (severity.HIGH * 10) +
    (severity.MEDIUM * 3) +
    severity.LOW
  );
  const severityPenalty = Math.min(100, Math.log10(1 + weightedSeverity) * 22);
  const densityPenalty = Math.min(
    100,
    ((weightedSeverity / safeFilesScanned) * 35) +
      ((totalViolations / safeFilesScanned) * 35)
  );
  const penalty = Math.max(severityPenalty, densityPenalty);
  return Math.max(0, Math.round(100 - penalty));
};
