import type { SmokeAssessment } from './mock-consumer-smoke-contract';

export const isExpectedModeResult = (assessment: SmokeAssessment): boolean => {
  if (!assessment.exists || assessment.status !== 'PASS') {
    return false;
  }

  if (assessment.mode === 'block') {
    return (
      assessment.preCommitExit === 1 &&
      assessment.prePushExit === 1 &&
      assessment.ciExit === 1 &&
      assessment.preCommitOutcome === 'BLOCK' &&
      assessment.prePushOutcome === 'BLOCK' &&
      assessment.ciOutcome === 'BLOCK'
    );
  }

  return (
    assessment.preCommitExit === 0 &&
    assessment.prePushExit === 0 &&
    assessment.ciExit === 0 &&
    assessment.preCommitOutcome === 'PASS' &&
    assessment.prePushOutcome === 'PASS' &&
    assessment.ciOutcome === 'PASS'
  );
};
