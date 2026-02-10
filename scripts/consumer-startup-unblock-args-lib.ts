import {
  CONSUMER_STARTUP_UNBLOCK_VALUE_ARG_SETTERS,
  type ConsumerStartupUnblockValueArg,
} from './consumer-startup-unblock-arg-setters-lib';
import type { ConsumerStartupUnblockCliOptions } from './consumer-startup-unblock-args-contract';
import { createConsumerStartupUnblockDefaultOptions } from './consumer-startup-unblock-args-defaults-lib';

export type { ConsumerStartupUnblockCliOptions } from './consumer-startup-unblock-args-contract';
export {
  DEFAULT_CONSUMER_STARTUP_UNBLOCK_AUTH_REPORT_FILE,
  DEFAULT_CONSUMER_STARTUP_UNBLOCK_OUT_FILE,
  DEFAULT_CONSUMER_STARTUP_UNBLOCK_REPO,
  DEFAULT_CONSUMER_STARTUP_UNBLOCK_SUPPORT_BUNDLE_FILE,
  DEFAULT_CONSUMER_STARTUP_UNBLOCK_WORKFLOW_LINT_FILE,
} from './consumer-startup-unblock-args-contract';

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

export const parseConsumerStartupUnblockArgs = (
  args: ReadonlyArray<string>
): ConsumerStartupUnblockCliOptions => {
  const options: ConsumerStartupUnblockCliOptions = createConsumerStartupUnblockDefaultOptions();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg in CONSUMER_STARTUP_UNBLOCK_VALUE_ARG_SETTERS) {
      const value = readRequiredArgValue(args, index, arg);
      const setter =
        CONSUMER_STARTUP_UNBLOCK_VALUE_ARG_SETTERS[arg as ConsumerStartupUnblockValueArg];
      setter(options, value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
