import type { SummarizePhase5ExecutionClosureParams } from './phase5-execution-closure-status-contract';

export const collectPhase5ExecutionClosureMissingInputs = (
  params: SummarizePhase5ExecutionClosureParams
): string[] => {
  const missingInputs: string[] = [];

  if (!params.hasPhase5BlockersReport) {
    missingInputs.push('Missing Phase 5 blockers readiness report');
  }
  if (!params.hasConsumerUnblockReport) {
    missingInputs.push('Missing consumer startup unblock status report');
  }
  if (params.requireAdapterReadiness && !params.hasAdapterReadinessReport) {
    missingInputs.push('Missing adapter readiness report');
  }

  return missingInputs;
};
