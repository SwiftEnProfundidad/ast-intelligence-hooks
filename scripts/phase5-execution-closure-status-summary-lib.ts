import {
  dedupePhase5ExecutionClosureValues,
  type Phase5ExecutionClosureSummary,
  type SummarizePhase5ExecutionClosureParams,
} from './phase5-execution-closure-status-contract';

export const summarizePhase5ExecutionClosure = (
  params: SummarizePhase5ExecutionClosureParams
): Phase5ExecutionClosureSummary => {
  const missingInputs: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!params.hasPhase5BlockersReport) {
    missingInputs.push('Missing Phase 5 blockers readiness report');
  }
  if (!params.hasConsumerUnblockReport) {
    missingInputs.push('Missing consumer startup unblock status report');
  }
  if (params.requireAdapterReadiness && !params.hasAdapterReadinessReport) {
    missingInputs.push('Missing adapter readiness report');
  }

  if (missingInputs.length === 0) {
    if ((params.phase5BlockersVerdict ?? '').toUpperCase() !== 'READY') {
      blockers.push(
        `Phase 5 blockers readiness verdict is ${params.phase5BlockersVerdict ?? 'unknown'}`
      );
    }
    if ((params.consumerUnblockVerdict ?? '').toUpperCase() !== 'READY_FOR_RETEST') {
      blockers.push(
        `Consumer startup unblock verdict is ${params.consumerUnblockVerdict ?? 'unknown'}`
      );
    }

    const adapterVerdict = (params.adapterReadinessVerdict ?? '').toUpperCase();
    if (params.requireAdapterReadiness) {
      if (adapterVerdict !== 'READY') {
        blockers.push(
          `Adapter readiness verdict is ${params.adapterReadinessVerdict ?? 'unknown'}`
        );
      }
    } else if (params.hasAdapterReadinessReport && adapterVerdict !== 'READY') {
      warnings.push(
        `Adapter readiness is ${params.adapterReadinessVerdict ?? 'unknown'} (not required in current mode)`
      );
    }
  }

  const verdict: Phase5ExecutionClosureSummary['verdict'] =
    missingInputs.length > 0 ? 'MISSING_INPUTS' : blockers.length > 0 ? 'BLOCKED' : 'READY';

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
