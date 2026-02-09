import {
  dedupePhase5ExecutionClosureValues,
  type Phase5ExecutionClosureSummary,
  type SummarizePhase5ExecutionClosureParams,
} from './phase5-execution-closure-status-contract';
import {
  collectPhase5ExecutionClosureBlockers,
  collectPhase5ExecutionClosureMissingInputs,
  collectPhase5ExecutionClosureWarnings,
  resolvePhase5ExecutionClosureSummaryVerdict,
} from './phase5-execution-closure-status-summary-helpers-lib';

export const summarizePhase5ExecutionClosure = (
  params: SummarizePhase5ExecutionClosureParams
): Phase5ExecutionClosureSummary => {
  const missingInputs = collectPhase5ExecutionClosureMissingInputs(params);
  const blockers = missingInputs.length === 0 ? collectPhase5ExecutionClosureBlockers(params) : [];
  const warnings = missingInputs.length === 0 ? collectPhase5ExecutionClosureWarnings(params) : [];
  const verdict = resolvePhase5ExecutionClosureSummaryVerdict({
    missingInputs,
    blockers,
  });

  return {
    verdict,
    blockers: dedupePhase5ExecutionClosureValues(blockers),
    missingInputs: dedupePhase5ExecutionClosureValues(missingInputs),
    warnings: dedupePhase5ExecutionClosureValues(warnings),
    phase5BlockersVerdict: params.phase5BlockersVerdict,
    consumerUnblockVerdict: params.consumerUnblockVerdict,
    adapterReadinessVerdict: params.adapterReadinessVerdict,
    requireAdapterReadiness: params.requireAdapterReadiness,
  };
};
