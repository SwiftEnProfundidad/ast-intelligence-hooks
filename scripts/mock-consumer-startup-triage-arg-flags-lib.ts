import type { MockConsumerStartupTriageCliOptions } from './mock-consumer-startup-triage-cli-contract';

export type MockConsumerStartupTriageFlagArg = '--dry-run';

export const isMockConsumerStartupTriageFlagArg = (
  arg: string
): arg is MockConsumerStartupTriageFlagArg => arg === '--dry-run';

export const applyMockConsumerStartupTriageFlagArg = (params: {
  options: MockConsumerStartupTriageCliOptions;
}): void => {
  params.options.dryRun = true;
};
