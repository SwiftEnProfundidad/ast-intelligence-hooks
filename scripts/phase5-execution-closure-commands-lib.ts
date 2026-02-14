import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
} from './phase5-execution-closure-plan-contract';
import { buildAdapterCommands } from './phase5-execution-closure-plan-adapter-lib';
import {
  buildAuthPreflightCommand,
  buildMockConsumerAbCommand,
  buildTriageCommand,
} from './phase5-execution-closure-plan-consumer-lib';
import {
  buildBlockersCommand,
  buildClosureStatusCommand,
} from './phase5-execution-closure-plan-phase5-lib';
import { validatePhase5ExecutionClosureOptions } from './phase5-execution-closure-plan-validation-lib';
import { resolvePhase5ExecutionClosureOutputs } from './phase5-execution-closure-outputs-lib';

export const buildPhase5ExecutionClosureCommands = (
  options: Phase5ExecutionClosureOptions
): Phase5ExecutionClosureCommand[] => {
  validatePhase5ExecutionClosureOptions(options);
  const outputs = resolvePhase5ExecutionClosureOutputs(options.outDir);

  return [
    ...buildAdapterCommands(options, outputs),
    ...buildAuthPreflightCommand(options, outputs),
    ...buildMockConsumerAbCommand(options, outputs),
    buildTriageCommand(options, outputs),
    buildBlockersCommand(options, outputs),
    buildClosureStatusCommand(options, outputs),
  ];
};
