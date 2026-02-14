import type { SummarizePhase5ExecutionClosureParams } from './phase5-execution-closure-status-contract';

const normalizeVerdict = (value?: string): string => (value ?? '').toUpperCase();

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

  if (
    params.requireAdapterReadiness &&
    normalizeVerdict(params.adapterReadinessVerdict) !== 'READY'
  ) {
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
