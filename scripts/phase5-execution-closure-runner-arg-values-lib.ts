import type { Phase5ExecutionClosureCliOptions } from './phase5-execution-closure-runner-contract';
import {
  applyPhase5ExecutionClosureValueArg,
  isPhase5ExecutionClosureValueArg,
} from './phase5-execution-closure-runner-arg-value-handlers-lib';

const readRequiredValue = (params: {
  args: ReadonlyArray<string>;
  index: number;
  flag: string;
}): string => {
  const value = params.args[params.index + 1];
  if (!value) {
    throw new Error(`Missing value for ${params.flag}`);
  }
  return value;
};

export const assignPhase5ExecutionClosureArgWithValue = (params: {
  options: Phase5ExecutionClosureCliOptions;
  args: ReadonlyArray<string>;
  index: number;
  arg: string;
}): boolean => {
  if (isPhase5ExecutionClosureValueArg(params.arg)) {
    applyPhase5ExecutionClosureValueArg({
      options: params.options,
      arg: params.arg,
      value: readRequiredValue({
        args: params.args,
        index: params.index,
        flag: params.arg,
      }),
    });
    return true;
  }

  return false;
};
