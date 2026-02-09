import type { Phase5ExecutionClosureCliOptions } from './phase5-execution-closure-runner-contract';
import { assignPhase5ExecutionClosureBooleanArg } from './phase5-execution-closure-runner-arg-flags-lib';
import { assignPhase5ExecutionClosureArgWithValue } from './phase5-execution-closure-runner-arg-values-lib';

export const applyPhase5ExecutionClosureArg = (params: {
  options: Phase5ExecutionClosureCliOptions;
  args: ReadonlyArray<string>;
  index: number;
}): number => {
  const arg = params.args[params.index];

  if (
    assignPhase5ExecutionClosureArgWithValue({
      options: params.options,
      args: params.args,
      index: params.index,
      arg,
    })
  ) {
    return params.index + 1;
  }

  if (
    assignPhase5ExecutionClosureBooleanArg({
      options: params.options,
      arg,
    })
  ) {
    return params.index;
  }

  throw new Error(`Unknown argument: ${arg}`);
};
