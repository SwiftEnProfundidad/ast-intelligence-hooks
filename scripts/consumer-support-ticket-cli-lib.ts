import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  CONSUMER_SUPPORT_TICKET_VALUE_ARG_SETTERS,
  type ConsumerSupportTicketValueArg,
} from './consumer-support-ticket-cli-arg-setters-lib';
import {
  type ConsumerSupportTicketCliOptions,
} from './consumer-support-ticket-cli-contract';
import { createConsumerSupportTicketDefaultOptions } from './consumer-support-ticket-cli-defaults-lib';

export type { ConsumerSupportTicketCliOptions } from './consumer-support-ticket-cli-contract';
export {
  DEFAULT_CONSUMER_SUPPORT_TICKET_AUTH_REPORT_FILE,
  DEFAULT_CONSUMER_SUPPORT_TICKET_OUT_FILE,
  DEFAULT_CONSUMER_SUPPORT_TICKET_REPO,
  DEFAULT_CONSUMER_SUPPORT_TICKET_SUPPORT_BUNDLE_FILE,
} from './consumer-support-ticket-cli-contract';

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

export const parseConsumerSupportTicketArgs = (
  args: ReadonlyArray<string>
): ConsumerSupportTicketCliOptions => {
  const options: ConsumerSupportTicketCliOptions = createConsumerSupportTicketDefaultOptions();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg in CONSUMER_SUPPORT_TICKET_VALUE_ARG_SETTERS) {
      const value = readRequiredArgValue(args, index, arg);
      const setter =
        CONSUMER_SUPPORT_TICKET_VALUE_ARG_SETTERS[arg as ConsumerSupportTicketValueArg];
      setter(options, value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

export const resolveRequiredConsumerSupportTicketFile = (
  cwd: string,
  pathLike: string
): string => {
  const absolute = resolve(cwd, pathLike);
  if (!existsSync(absolute)) {
    throw new Error(`Input file not found: ${pathLike}`);
  }
  return absolute;
};
