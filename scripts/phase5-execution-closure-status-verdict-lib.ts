import type { Phase5ExecutionClosureSummary } from './phase5-execution-closure-status-contract';

export const resolvePhase5ExecutionClosureSummaryVerdict = (params: {
  missingInputs: ReadonlyArray<string>;
  blockers: ReadonlyArray<string>;
}): Phase5ExecutionClosureSummary['verdict'] =>
  params.missingInputs.length > 0
    ? 'MISSING_INPUTS'
    : params.blockers.length > 0
      ? 'BLOCKED'
      : 'READY';
