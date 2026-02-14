import type { ConsumerSupportTicketCliOptions } from './consumer-support-ticket-cli-contract';

export type ConsumerSupportTicketValueArg =
  | '--repo'
  | '--support-bundle'
  | '--auth-report'
  | '--out';

type ConsumerSupportTicketValueSetter = (
  options: ConsumerSupportTicketCliOptions,
  value: string
) => void;

export const CONSUMER_SUPPORT_TICKET_VALUE_ARG_SETTERS: Record<
  ConsumerSupportTicketValueArg,
  ConsumerSupportTicketValueSetter
> = {
  '--repo': (options, value) => {
    options.repo = value;
  },
  '--support-bundle': (options, value) => {
    options.supportBundleFile = value;
  },
  '--auth-report': (options, value) => {
    options.authReportFile = value;
  },
  '--out': (options, value) => {
    options.outFile = value;
  },
};
