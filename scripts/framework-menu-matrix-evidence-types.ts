export const MATRIX_MENU_OPTION_IDS = [
  '1',
  '2',
  '3',
  '4',
  '9',
  '11',
  '12',
  '13',
  '14',
] as const;

export type MatrixOptionId = (typeof MATRIX_MENU_OPTION_IDS)[number];
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
