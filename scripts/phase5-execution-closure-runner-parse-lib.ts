import {
  createDefaultPhase5ExecutionClosureCliOptions,
  type Phase5ExecutionClosureCliOptions,
} from './phase5-execution-closure-runner-contract';
import { applyPhase5ExecutionClosureArg } from './phase5-execution-closure-runner-arg-handlers-lib';
import { normalizePhase5ExecutionClosureOptions } from './phase5-execution-closure-runner-options-normalizer-lib';

export const parsePhase5ExecutionClosureArgs = (
  args: ReadonlyArray<string>
): Phase5ExecutionClosureCliOptions => {
  const options: Phase5ExecutionClosureCliOptions =
    createDefaultPhase5ExecutionClosureCliOptions();

  for (let index = 0; index < args.length; index += 1) {
    index = applyPhase5ExecutionClosureArg({
      options,
      args,
      index,
    });
  }

  return normalizePhase5ExecutionClosureOptions(options);
};
