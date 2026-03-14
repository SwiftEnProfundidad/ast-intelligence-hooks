import { readLegacyAuditSummary } from './framework-menu-legacy-audit-lib';
import { toMatrixOptionReport } from './framework-menu-matrix-evidence-diagnosis';
import type { ConsumerMenuMatrixOptionReport, MatrixOptionId } from './framework-menu-matrix-evidence-types';

export type {
  ConsumerMenuMatrixOptionReport,
  ConsumerMenuMatrixReport,
  MatrixOptionDiagnosis,
  MatrixOptionId,
} from './framework-menu-matrix-evidence-types';
export { toMatrixOptionReport } from './framework-menu-matrix-evidence-diagnosis';

export const readMatrixOptionReport = (
  repoRoot: string,
  optionId: MatrixOptionId
): ConsumerMenuMatrixOptionReport => {
  return toMatrixOptionReport(optionId, readLegacyAuditSummary(repoRoot));
};
