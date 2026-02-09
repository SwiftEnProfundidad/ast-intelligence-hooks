export type MockConsumerStartupTriageCliOptions = {
  repo: string;
  outDir: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  dryRun: boolean;
};

export const DEFAULT_MOCK_CONSUMER_TRIAGE_REPO = 'owner/repo';
export const DEFAULT_MOCK_CONSUMER_TRIAGE_OUT_DIR = '.audit-reports/phase5';
export const DEFAULT_MOCK_CONSUMER_TRIAGE_BLOCK_SUMMARY =
  '.audit-reports/package-smoke/block/summary.md';
export const DEFAULT_MOCK_CONSUMER_TRIAGE_MINIMAL_SUMMARY =
  '.audit-reports/package-smoke/minimal/summary.md';

export const parseMockConsumerStartupTriageArgs = (
  args: ReadonlyArray<string>
): MockConsumerStartupTriageCliOptions => {
  const options: MockConsumerStartupTriageCliOptions = {
    repo: DEFAULT_MOCK_CONSUMER_TRIAGE_REPO,
    outDir: DEFAULT_MOCK_CONSUMER_TRIAGE_OUT_DIR,
    blockSummaryFile: DEFAULT_MOCK_CONSUMER_TRIAGE_BLOCK_SUMMARY,
    minimalSummaryFile: DEFAULT_MOCK_CONSUMER_TRIAGE_MINIMAL_SUMMARY,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }
    if (arg === '--out-dir') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out-dir');
      }
      options.outDir = value;
      index += 1;
      continue;
    }
    if (arg === '--block-summary') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --block-summary');
      }
      options.blockSummaryFile = value;
      index += 1;
      continue;
    }
    if (arg === '--minimal-summary') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --minimal-summary');
      }
      options.minimalSummaryFile = value;
      index += 1;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
