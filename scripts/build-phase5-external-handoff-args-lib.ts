import type { Phase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';
import { createDefaultPhase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';
import { applyPhase5ExternalHandoffArg } from './build-phase5-external-handoff-arg-handlers-lib';

export const parsePhase5ExternalHandoffArgs = (
  args: ReadonlyArray<string>
): Phase5ExternalHandoffCliOptions => {
  const options = createDefaultPhase5ExternalHandoffCliOptions();

  for (let index = 0; index < args.length; index += 1) {
    const consumed = applyPhase5ExternalHandoffArg({
      args,
      index,
      options,
    });

    if (consumed < 0) {
      throw new Error(`Unknown argument: ${args[index]}`);
    }

    index += consumed;
  }

  return options;
};
