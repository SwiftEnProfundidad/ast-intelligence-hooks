import type {
  Phase5ExecutionClosureSummary,
  SummarizePhase5ExecutionClosureParams,
} from './phase5-execution-closure-status-contract';

const normalizeVerdict = (value?: string): string => (value ?? '').toUpperCase();

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

export const collectPhase5ExecutionClosureBlockers = (
  params: SummarizePhase5ExecutionClosureParams
): string[] => {
  const blockers: string[] = [];

  if (normalizeVerdict(params.phase5BlockersVerdict) !== 'READY') {
    blockers.push(
      `Phase 5 blockers readiness verdict is ${params.phase5BlockersVerdict ?? 'unknown'}`
    );
  }
  if (normalizeVerdict(params.consumerUnblockVerdict) !== 'READY_FOR_RETEST') {
    blockers.push(
      `Consumer startup unblock verdict is ${params.consumerUnblockVerdict ?? 'unknown'}`
    );
  }

  if (params.requireAdapterReadiness && normalizeVerdict(params.adapterReadinessVerdict) !== 'READY') {
    blockers.push(
      `Adapter readiness verdict is ${params.adapterReadinessVerdict ?? 'unknown'}`
    );
  }

  return blockers;
};

export const collectPhase5ExecutionClosureWarnings = (
  params: SummarizePhase5ExecutionClosureParams
): string[] => {
  if (params.requireAdapterReadiness || !params.hasAdapterReadinessReport) {
    return [];
  }

  if (normalizeVerdict(params.adapterReadinessVerdict) === 'READY') {
    return [];
  }

  return [
    `Adapter readiness is ${params.adapterReadinessVerdict ?? 'unknown'} (not required in current mode)`,
  ];
};

export const resolvePhase5ExecutionClosureSummaryVerdict = (params: {
  missingInputs: ReadonlyArray<string>;
  blockers: ReadonlyArray<string>;
}): Phase5ExecutionClosureSummary['verdict'] =>
  params.missingInputs.length > 0
    ? 'MISSING_INPUTS'
    : params.blockers.length > 0
      ? 'BLOCKED'
      : 'READY';
