import type {
  ParsedAdapterRealSessionReport,
  ParsedConsumerStartupTriageReport,
  Phase5BlockersSummary,
} from './phase5-blockers-contract';
import { dedupePhase5BlockersValues } from './phase5-blockers-contract';

export const summarizePhase5Blockers = (params: {
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  adapter?: ParsedAdapterRealSessionReport;
  consumer?: ParsedConsumerStartupTriageReport;
  requireAdapterReport?: boolean;
}): Phase5BlockersSummary => {
  const blockers: string[] = [];
  const missingInputs: string[] = [];
  const adapterRequired = params.requireAdapterReport ?? false;

  if (adapterRequired && !params.hasAdapterReport) {
    missingInputs.push('Missing Adapter real-session report');
  }
  if (!params.hasConsumerTriageReport) {
    missingInputs.push('Missing consumer startup triage report');
  }

  if (missingInputs.length > 0) {
    return {
      verdict: 'MISSING_INPUTS',
      blockers: missingInputs,
      adapterValidationResult: params.adapter?.validationResult,
      consumerTriageVerdict: params.consumer?.verdict,
      adapterRequired,
      missingInputs,
    };
  }

  if (params.hasAdapterReport && params.adapter?.validationResult !== 'PASS') {
    blockers.push(
      `Adapter real-session validation is ${params.adapter?.validationResult ?? 'unknown'}`
    );
  }

  if (params.hasAdapterReport && params.adapter?.nodeCommandNotFound) {
    blockers.push('Adapter runtime still reports node command resolution failures');
  }

  if (params.consumer?.verdict !== 'READY') {
    blockers.push(
      `Consumer startup triage verdict is ${params.consumer?.verdict ?? 'unknown'}`
    );
  }

  for (const step of params.consumer?.requiredFailedSteps ?? []) {
    blockers.push(`Consumer triage required step failed: ${step}`);
  }

  return {
    verdict: blockers.length === 0 ? 'READY' : 'BLOCKED',
    blockers: dedupePhase5BlockersValues(blockers),
    adapterValidationResult: params.adapter?.validationResult,
    consumerTriageVerdict: params.consumer?.verdict,
    adapterRequired,
    missingInputs,
  };
};
