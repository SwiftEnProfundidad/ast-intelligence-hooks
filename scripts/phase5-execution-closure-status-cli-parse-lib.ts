import {
  createDefaultPhase5ExecutionClosureStatusCliOptions,
  type Phase5ExecutionClosureStatusCliOptions,
} from './phase5-execution-closure-status-cli-contract';

const readRequiredArgValue = (params: {
  args: ReadonlyArray<string>;
  index: number;
  arg: string;
}): string => {
  const value = params.args[params.index + 1];
  if (!value) {
    throw new Error(`Missing value for ${params.arg}`);
  }
  return value;
};

export const parsePhase5ExecutionClosureStatusArgs = (
  args: ReadonlyArray<string>
): Phase5ExecutionClosureStatusCliOptions => {
  const options = createDefaultPhase5ExecutionClosureStatusCliOptions();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--phase5-blockers-report') {
      options.phase5BlockersReportFile = readRequiredArgValue({
        args,
        index,
        arg: '--phase5-blockers-report',
      });
      index += 1;
      continue;
    }

    if (arg === '--consumer-unblock-report') {
      options.consumerUnblockReportFile = readRequiredArgValue({
        args,
        index,
        arg: '--consumer-unblock-report',
      });
      index += 1;
      continue;
    }

    if (arg === '--adapter-readiness-report') {
      options.adapterReadinessReportFile = readRequiredArgValue({
        args,
        index,
        arg: '--adapter-readiness-report',
      });
      index += 1;
      continue;
    }

    if (arg === '--out') {
      options.outFile = readRequiredArgValue({
        args,
        index,
        arg: '--out',
      });
      index += 1;
      continue;
    }

    if (arg === '--require-adapter-readiness') {
      options.requireAdapterReadiness = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
