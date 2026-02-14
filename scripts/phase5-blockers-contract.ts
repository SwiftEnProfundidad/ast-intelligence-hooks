export type ParsedAdapterRealSessionReport = {
  validationResult?: 'PASS' | 'FAIL';
  reTestRequired?: boolean;
  nodeCommandNotFound: boolean;
};

export type ParsedConsumerStartupTriageReport = {
  verdict?: 'READY' | 'BLOCKED';
  requiredFailedSteps: ReadonlyArray<string>;
};

export type Phase5BlockersSummary = {
  verdict: 'READY' | 'BLOCKED' | 'MISSING_INPUTS';
  blockers: ReadonlyArray<string>;
  adapterValidationResult?: 'PASS' | 'FAIL';
  consumerTriageVerdict?: 'READY' | 'BLOCKED';
  adapterRequired: boolean;
  missingInputs: ReadonlyArray<string>;
};

export const dedupePhase5BlockersValues = (
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
