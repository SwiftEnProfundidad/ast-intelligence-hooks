import {
  dedupeAdapterReadinessValues,
  type AdapterReadinessEntry,
  type AdapterReadinessSummary,
  type SummarizeAdapterReadinessParams,
} from './adapter-readiness-contract';

export const summarizeAdapterReadiness = (
  params: SummarizeAdapterReadinessParams
): AdapterReadinessSummary => {
  const blockers: string[] = [];
  const missingInputs: string[] = [];
  const adapters: AdapterReadinessEntry[] = [];

  if (!params.hasAdapterReport) {
    missingInputs.push('Missing Adapter adapter report');
    adapters.push({
      name: 'adapter',
      status: 'MISSING',
      notes: ['No Adapter diagnostics report was provided.'],
    });
  } else {
    const notes: string[] = [];
    let status: AdapterReadinessEntry['status'] = 'PASS';

    if (params.adapter?.validationResult !== 'PASS') {
      status = 'FAIL';
      notes.push(
        `Adapter validation result is ${params.adapter?.validationResult ?? 'unknown'}`
      );
      blockers.push(
        `Adapter adapter validation is ${params.adapter?.validationResult ?? 'unknown'}`
      );
    }

    if (params.adapter?.nodeCommandNotFound) {
      status = 'FAIL';
      notes.push('Adapter runtime reports node command resolution failures.');
      blockers.push('Adapter adapter runtime reports `node: command not found`.');
    }

    if (notes.length === 0) {
      notes.push('Adapter adapter diagnostics are healthy.');
    }

    adapters.push({
      name: 'adapter',
      status,
      notes,
    });
  }

  const verdict: AdapterReadinessSummary['verdict'] =
    blockers.length > 0 ? 'BLOCKED' : missingInputs.length > 0 ? 'PENDING' : 'READY';

  return {
    verdict,
    adapters,
    blockers: dedupeAdapterReadinessValues(blockers),
    missingInputs: dedupeAdapterReadinessValues(missingInputs),
  };
};
