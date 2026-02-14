import type {
  ParsedAdapterRealSessionReport,
  ParsedConsumerStartupTriageReport,
} from './phase5-blockers-contract';
import { dedupePhase5BlockersValues } from './phase5-blockers-contract';

export const collectPhase5DetectedBlockers = (params: {
  hasAdapterReport: boolean;
  adapter?: ParsedAdapterRealSessionReport;
  consumer?: ParsedConsumerStartupTriageReport;
}): string[] => {
  const blockers: string[] = [];

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

  return dedupePhase5BlockersValues(blockers);
};
