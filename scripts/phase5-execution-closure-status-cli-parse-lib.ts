import {
  createDefaultPhase5ExecutionClosureStatusCliOptions,
  type Phase5ExecutionClosureStatusCliOptions,
} from './phase5-execution-closure-status-cli-contract';
import {
  applyPhase5ExecutionClosureStatusFlagArg,
  isPhase5ExecutionClosureStatusFlagArg,
} from './phase5-execution-closure-status-arg-flags-lib';
import {
  applyPhase5ExecutionClosureStatusValueArg,
  isPhase5ExecutionClosureStatusValueArg,
} from './phase5-execution-closure-status-arg-values-lib';

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

    if (isPhase5ExecutionClosureStatusValueArg(arg)) {
      applyPhase5ExecutionClosureStatusValueArg({
        options,
        arg,
        value: readRequiredArgValue({
          args,
          index,
          arg,
        }),
      });
      index += 1;
      continue;
    }

    if (isPhase5ExecutionClosureStatusFlagArg(arg)) {
      applyPhase5ExecutionClosureStatusFlagArg({
        options,
      });
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
