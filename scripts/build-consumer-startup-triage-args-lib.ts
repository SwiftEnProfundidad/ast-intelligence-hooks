import type { BuildConsumerStartupTriageCliOptions } from './build-consumer-startup-triage-contract';
import { createDefaultBuildConsumerStartupTriageCliOptions } from './build-consumer-startup-triage-contract';
import {
  applyBuildConsumerStartupTriageFlagArg,
  isBuildConsumerStartupTriageFlagArg,
} from './build-consumer-startup-triage-arg-flags-lib';
import {
  applyBuildConsumerStartupTriageValueArg,
  isBuildConsumerStartupTriageValueArg,
} from './build-consumer-startup-triage-arg-values-lib';

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

export const parseBuildConsumerStartupTriageArgs = (
  args: ReadonlyArray<string>
): BuildConsumerStartupTriageCliOptions => {
  const options = createDefaultBuildConsumerStartupTriageCliOptions();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (isBuildConsumerStartupTriageValueArg(arg)) {
      const value = readRequiredArgValue(args, index, arg);
      applyBuildConsumerStartupTriageValueArg({
        options,
        arg,
        value,
      });
      index += 1;
      continue;
    }

    if (isBuildConsumerStartupTriageFlagArg(arg)) {
      applyBuildConsumerStartupTriageFlagArg({
        options,
        arg,
      });
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repo) {
    throw new Error('Missing required argument --repo <owner/repo>');
  }

  return options;
};
