export type ParsedWorkflowLintReport = {
  exitCode?: number;
  findingsCount: number;
  findings: ReadonlyArray<string>;
};

export type ConsumerStartupUnblockSummary = {
  verdict: 'READY_FOR_RETEST' | 'BLOCKED' | 'MISSING_INPUTS';
  blockers: ReadonlyArray<string>;
  startupFailureRuns?: number;
  startupStalledRuns?: number;
  authVerdict?: string;
  missingUserScope: boolean;
  lintFindingsCount: number;
};

export const dedupeConsumerStartupUnblockValues = (
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

export const parseConsumerStartupUnblockInteger = (
  value?: string
): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};
