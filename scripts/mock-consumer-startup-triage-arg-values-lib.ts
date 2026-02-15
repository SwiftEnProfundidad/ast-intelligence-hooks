import type { MockConsumerStartupTriageCliOptions } from './mock-consumer-startup-triage-cli-contract';

export type MockConsumerStartupTriageValueArg =
  '--repo'
  | '--out-dir'
  | '--block-summary'
  | '--minimal-summary';

export const isMockConsumerStartupTriageValueArg = (
  arg: string
): arg is MockConsumerStartupTriageValueArg =>
  arg === '--repo' ||
  arg === '--out-dir' ||
  arg === '--block-summary' ||
  arg === '--minimal-summary';

export const applyMockConsumerStartupTriageValueArg = (params: {
  options: MockConsumerStartupTriageCliOptions;
  arg: MockConsumerStartupTriageValueArg;
  value: string;
}): void => {
  if (params.arg === '--repo') {
    params.options.repo = params.value;
    return;
  }
  if (params.arg === '--out-dir') {
    params.options.outDir = params.value;
    return;
  }
  if (params.arg === '--block-summary') {
    params.options.blockSummaryFile = params.value;
    return;
  }
  params.options.minimalSummaryFile = params.value;
};
