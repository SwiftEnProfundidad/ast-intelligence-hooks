import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
  Phase5ExecutionClosureOutputs,
} from './phase5-execution-closure-plan-contract';
import {
  buildAdapterReadinessCommand,
  buildAdapterRealSessionCommand,
  buildAdapterSessionStatusCommand,
} from './phase5-execution-closure-plan-adapter-commands-lib';

export const buildAdapterCommands = (
  options: Phase5ExecutionClosureOptions,
  outputs: Phase5ExecutionClosureOutputs
): Phase5ExecutionClosureCommand[] => {
  if (!options.includeAdapter) {
    return [];
  }

  return [
    buildAdapterSessionStatusCommand(options, outputs),
    buildAdapterRealSessionCommand(options, outputs),
    buildAdapterReadinessCommand(options, outputs),
  ];
};
