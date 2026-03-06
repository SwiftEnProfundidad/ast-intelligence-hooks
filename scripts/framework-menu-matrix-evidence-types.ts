export type MatrixOptionId = '1' | '2' | '3' | '4' | '9';
export type MatrixOptionDiagnosis =
  | 'scope-empty'
  | 'repo-clean'
  | 'violations-detected'
  | 'unknown';

export type ConsumerMenuMatrixOptionReport = {
  stage: string;
  outcome: string;
  filesScanned: number;
  totalViolations: number;
  diagnosis: MatrixOptionDiagnosis;
};

export type ConsumerMenuMatrixReport = {
  byOption: Record<MatrixOptionId, ConsumerMenuMatrixOptionReport>;
};
