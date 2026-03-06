import type { LegacyAuditSummary } from './framework-menu-legacy-audit-lib';
import type {
  ConsumerMenuMatrixOptionReport,
  MatrixOptionDiagnosis,
  MatrixOptionId,
} from './framework-menu-matrix-evidence-types';

const EMPTY_OPTION_REPORT: ConsumerMenuMatrixOptionReport = {
  stage: 'UNKNOWN',
  outcome: 'UNKNOWN',
  filesScanned: 0,
  totalViolations: 0,
  diagnosis: 'unknown',
};

const resolveMatrixOptionDiagnosis = (
  summary: LegacyAuditSummary
): MatrixOptionDiagnosis => {
  if (summary.status !== 'ok') {
    return 'unknown';
  }
  if (summary.totalViolations > 0) {
    return 'violations-detected';
  }
  if (summary.filesScanned <= 0) {
    return 'scope-empty';
  }
  return 'repo-clean';
};

export const toMatrixOptionReport = (
  optionId: MatrixOptionId,
  summary: LegacyAuditSummary
): ConsumerMenuMatrixOptionReport => {
  void optionId;
  if (summary.status !== 'ok') {
    return EMPTY_OPTION_REPORT;
  }
  return {
    stage: summary.stage,
    outcome: summary.outcome,
    filesScanned: summary.filesScanned,
    totalViolations: summary.totalViolations,
    diagnosis: resolveMatrixOptionDiagnosis(summary),
  };
};
