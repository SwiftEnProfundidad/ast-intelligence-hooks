import {
  MOCK_CONSUMER_AB_FLAG_ARG_SETTERS,
  MOCK_CONSUMER_AB_VALUE_ARG_SETTERS,
  type MockConsumerAbValueArg,
} from './mock-consumer-ab-cli-arg-setters-lib';
import { createMockConsumerAbDefaultCliOptions } from './mock-consumer-ab-cli-defaults-lib';
import type { MockConsumerAbCliOptions } from './mock-consumer-ab-contract';

const readRequiredArgValue = (
  args: ReadonlyArray<string>,
  index: number,
  option: string
): string => {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${option}`);
  }
  return value;
};

export const parseMockConsumerAbArgs = (
  args: ReadonlyArray<string>
): MockConsumerAbCliOptions => {
  const options: MockConsumerAbCliOptions = createMockConsumerAbDefaultCliOptions();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg in MOCK_CONSUMER_AB_VALUE_ARG_SETTERS) {
      const value = readRequiredArgValue(args, index, arg);
      const setter = MOCK_CONSUMER_AB_VALUE_ARG_SETTERS[arg as MockConsumerAbValueArg];
      setter(options, value);
      index += 1;
      continue;
    }

    if (arg in MOCK_CONSUMER_AB_FLAG_ARG_SETTERS) {
      const setter = MOCK_CONSUMER_AB_FLAG_ARG_SETTERS[arg as '--dry-run'];
      setter(options);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
