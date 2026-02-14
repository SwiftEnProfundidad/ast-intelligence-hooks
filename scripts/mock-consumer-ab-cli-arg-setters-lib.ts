import type { MockConsumerAbCliOptions } from './mock-consumer-ab-contract';

export type MockConsumerAbValueArg =
  | '--repo'
  | '--out'
  | '--block-summary'
  | '--minimal-summary'
  | '--block-evidence'
  | '--minimal-evidence';

type MockConsumerAbValueSetter = (
  options: MockConsumerAbCliOptions,
  value: string
) => void;

type MockConsumerAbFlagSetter = (options: MockConsumerAbCliOptions) => void;

export const MOCK_CONSUMER_AB_VALUE_ARG_SETTERS: Record<
  MockConsumerAbValueArg,
  MockConsumerAbValueSetter
> = {
  '--repo': (options, value) => {
    options.repo = value;
  },
  '--out': (options, value) => {
    options.outFile = value;
  },
  '--block-summary': (options, value) => {
    options.blockSummaryFile = value;
  },
  '--minimal-summary': (options, value) => {
    options.minimalSummaryFile = value;
  },
  '--block-evidence': (options, value) => {
    options.blockEvidenceFile = value;
  },
  '--minimal-evidence': (options, value) => {
    options.minimalEvidenceFile = value;
  },
};

export const MOCK_CONSUMER_AB_FLAG_ARG_SETTERS: Record<'--dry-run', MockConsumerAbFlagSetter> = {
  '--dry-run': (options) => {
    options.dryRun = true;
  },
};
