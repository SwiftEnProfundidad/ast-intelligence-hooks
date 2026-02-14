import {
  applyMockConsumerStartupTriageFlagArg,
  isMockConsumerStartupTriageFlagArg,
} from './mock-consumer-startup-triage-arg-flags-lib';
import {
  applyMockConsumerStartupTriageValueArg,
  isMockConsumerStartupTriageValueArg,
} from './mock-consumer-startup-triage-arg-values-lib';

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
    if (isMockConsumerStartupTriageValueArg(arg)) {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      applyMockConsumerStartupTriageValueArg({
        options,
        arg,
        value,
      });
      index += 1;
      continue;
    }

    if (isMockConsumerStartupTriageFlagArg(arg)) {
      applyMockConsumerStartupTriageFlagArg({
        options,
      });
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
