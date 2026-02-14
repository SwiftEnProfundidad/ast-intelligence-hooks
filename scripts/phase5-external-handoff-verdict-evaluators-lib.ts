import type {
  Phase5ExternalHandoffSummary,
  SummarizePhase5ExternalHandoffParams,
} from './phase5-external-handoff-contract';

const normalizeVerdict = (value?: string): string => (value ?? '').toUpperCase();

export const collectPhase5ExternalHandoffVerdictBlockers = (
  params: SummarizePhase5ExternalHandoffParams
): string[] => {
  const blockers: string[] = [];

  if (normalizeVerdict(params.phase5StatusVerdict) !== 'READY') {
    blockers.push(
      `Phase 5 execution closure status verdict is ${params.phase5StatusVerdict ?? 'unknown'}`
    );
  }
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
  if (params.requireMockAbReport && normalizeVerdict(params.mockAbVerdict) !== 'READY') {
    blockers.push(`Mock consumer A/B verdict is ${params.mockAbVerdict ?? 'unknown'}`);
  }

  return blockers;
};

export const collectPhase5ExternalHandoffVerdictWarnings = (
  params: SummarizePhase5ExternalHandoffParams
): string[] => {
  const warnings: string[] = [];

  if (
    !params.requireMockAbReport &&
    params.hasMockAbReport &&
    normalizeVerdict(params.mockAbVerdict) !== 'READY'
  ) {
    warnings.push(
      `Mock consumer A/B verdict is ${params.mockAbVerdict ?? 'unknown'} (not required in current mode)`
    );
  }

  if (params.hasRunReport && normalizeVerdict(params.runReportVerdict) !== 'READY') {
    warnings.push(
      `Phase 5 closure run report verdict is ${params.runReportVerdict ?? 'unknown'}`
    );
  }

  return warnings;
};

export const resolvePhase5ExternalHandoffSummaryVerdict = (params: {
  missingInputs: ReadonlyArray<string>;
  blockers: ReadonlyArray<string>;
}): Phase5ExternalHandoffSummary['verdict'] =>
  params.missingInputs.length > 0
    ? 'MISSING_INPUTS'
    : params.blockers.length > 0
      ? 'BLOCKED'
      : 'READY';
