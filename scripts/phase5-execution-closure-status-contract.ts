export type Phase5ExecutionClosureSummary = {
  verdict: 'READY' | 'BLOCKED' | 'MISSING_INPUTS';
  blockers: ReadonlyArray<string>;
  missingInputs: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
  phase5BlockersVerdict?: string;
  consumerUnblockVerdict?: string;
  adapterReadinessVerdict?: string;
  requireAdapterReadiness: boolean;
};

export type SummarizePhase5ExecutionClosureParams = {
  hasPhase5BlockersReport: boolean;
  hasConsumerUnblockReport: boolean;
  hasAdapterReadinessReport: boolean;
  phase5BlockersVerdict?: string;
  consumerUnblockVerdict?: string;
  adapterReadinessVerdict?: string;
  requireAdapterReadiness: boolean;
};

export type BuildPhase5ExecutionClosureStatusMarkdownParams = {
  generatedAt: string;
  phase5BlockersReportPath: string;
  consumerUnblockReportPath: string;
  adapterReadinessReportPath: string;
  hasPhase5BlockersReport: boolean;
  hasConsumerUnblockReport: boolean;
  hasAdapterReadinessReport: boolean;
  summary: Phase5ExecutionClosureSummary;
};

export const dedupePhase5ExecutionClosureValues = (
  values: ReadonlyArray<string>
): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }

  return output;
};
