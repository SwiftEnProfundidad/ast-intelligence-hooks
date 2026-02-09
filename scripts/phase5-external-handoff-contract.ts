export type Phase5ExternalHandoffSummary = {
  verdict: 'READY' | 'BLOCKED' | 'MISSING_INPUTS';
  blockers: ReadonlyArray<string>;
  missingInputs: ReadonlyArray<string>;
  warnings: ReadonlyArray<string>;
  phase5StatusVerdict?: string;
  phase5BlockersVerdict?: string;
  consumerUnblockVerdict?: string;
  mockAbVerdict?: string;
  runReportVerdict?: string;
  artifactUrls: ReadonlyArray<string>;
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
};

export const dedupePhase5ExternalHandoffValues = (
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
