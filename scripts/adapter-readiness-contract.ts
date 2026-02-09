export type ParsedAdapterReport = {
  validationResult?: 'PASS' | 'FAIL';
  nodeCommandNotFound: boolean;
};

export type AdapterReadinessEntry = {
  name: 'adapter';
  status: 'PASS' | 'FAIL' | 'MISSING';
  notes: ReadonlyArray<string>;
};

export type AdapterReadinessSummary = {
  verdict: 'READY' | 'BLOCKED' | 'PENDING';
  adapters: ReadonlyArray<AdapterReadinessEntry>;
  blockers: ReadonlyArray<string>;
  missingInputs: ReadonlyArray<string>;
};

export type SummarizeAdapterReadinessParams = {
  hasAdapterReport: boolean;
  adapter?: ParsedAdapterReport;
};

export type BuildAdapterReadinessMarkdownParams = {
  generatedAt: string;
  adapterReportPath: string;
  hasAdapterReport: boolean;
  summary: AdapterReadinessSummary;
};

export const dedupeAdapterReadinessValues = (
  values: ReadonlyArray<string>
): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }

  return result;
};
