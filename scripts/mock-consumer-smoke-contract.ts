export type SmokeMode = 'block' | 'minimal';

export type SmokeAssessment = {
  mode: SmokeMode;
  file: string;
  exists: boolean;
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  preCommitExit?: number;
  prePushExit?: number;
  ciExit?: number;
  preCommitOutcome?: string;
  prePushOutcome?: string;
  ciOutcome?: string;
};
