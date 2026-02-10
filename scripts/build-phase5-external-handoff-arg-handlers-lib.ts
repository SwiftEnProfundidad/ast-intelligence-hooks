import type { Phase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';
import {
  applyPhase5ExternalHandoffFlagArg,
  isPhase5ExternalHandoffFlagArg,
} from './build-phase5-external-handoff-arg-flags-lib';
import {
  applyPhase5ExternalHandoffValueArg,
  isPhase5ExternalHandoffValueArg,
} from './build-phase5-external-handoff-arg-values-lib';

const readRequiredValue = (
  args: ReadonlyArray<string>,
  index: number,
  flag: string
): string => {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
};

export const applyPhase5ExternalHandoffArg = (params: {
  args: ReadonlyArray<string>;
  index: number;
  options: Phase5ExternalHandoffCliOptions;
}): number => {
  const arg = params.args[params.index];

  if (isPhase5ExternalHandoffValueArg(arg)) {
    applyPhase5ExternalHandoffValueArg({
      options: params.options,
      arg,
      value: readRequiredValue(params.args, params.index, arg),
    });
    return 1;
  }

  if (isPhase5ExternalHandoffFlagArg(arg)) {
    applyPhase5ExternalHandoffFlagArg({
      options: params.options,
      arg,
    });
    return 0;
  }

  return -1;
};
