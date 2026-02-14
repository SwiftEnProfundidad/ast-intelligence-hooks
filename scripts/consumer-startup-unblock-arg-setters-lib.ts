import type { ConsumerStartupUnblockCliOptions } from './consumer-startup-unblock-args-contract';

export type ConsumerStartupUnblockValueArg =
  | '--repo'
  | '--support-bundle'
  | '--auth-report'
  | '--workflow-lint-report'
  | '--out';

type ConsumerStartupUnblockValueSetter = (
  options: ConsumerStartupUnblockCliOptions,
  value: string
) => void;

export const CONSUMER_STARTUP_UNBLOCK_VALUE_ARG_SETTERS: Record<
  ConsumerStartupUnblockValueArg,
  ConsumerStartupUnblockValueSetter
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
  '--workflow-lint-report': (options, value) => {
    options.workflowLintReportFile = value;
  },
  '--out': (options, value) => {
    options.outFile = value;
  },
};
