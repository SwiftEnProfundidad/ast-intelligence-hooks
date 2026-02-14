import type {
  ParsedAdapterRealSessionReport,
  ParsedConsumerStartupTriageReport,
  Phase5BlockersSummary,
} from './phase5-blockers-contract';
import { collectPhase5DetectedBlockers } from './phase5-blockers-detected-blockers-lib';
import { collectPhase5BlockersMissingInputs } from './phase5-blockers-missing-inputs-lib';

export const summarizePhase5Blockers = (params: {
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  adapter?: ParsedAdapterRealSessionReport;
  consumer?: ParsedConsumerStartupTriageReport;
  requireAdapterReport?: boolean;
}): Phase5BlockersSummary => {
  const adapterRequired = params.requireAdapterReport ?? false;
  const missingInputs = collectPhase5BlockersMissingInputs({
    hasAdapterReport: params.hasAdapterReport,
    hasConsumerTriageReport: params.hasConsumerTriageReport,
    adapterRequired,
  });

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

  const blockers = collectPhase5DetectedBlockers({
    hasAdapterReport: params.hasAdapterReport,
    adapter: params.adapter,
    consumer: params.consumer,
  });

  return {
    verdict: blockers.length === 0 ? 'READY' : 'BLOCKED',
    blockers,
    adapterValidationResult: params.adapter?.validationResult,
    consumerTriageVerdict: params.consumer?.verdict,
    adapterRequired,
    missingInputs,
  };
};
