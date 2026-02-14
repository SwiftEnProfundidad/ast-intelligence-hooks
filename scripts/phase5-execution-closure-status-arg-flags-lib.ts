import type { Phase5ExecutionClosureStatusCliOptions } from './phase5-execution-closure-status-cli-contract';

export type Phase5ExecutionClosureStatusFlagArg = '--require-adapter-readiness';

export const isPhase5ExecutionClosureStatusFlagArg = (
  arg: string
): arg is Phase5ExecutionClosureStatusFlagArg => arg === '--require-adapter-readiness';

export const applyPhase5ExecutionClosureStatusFlagArg = (params: {
  options: Phase5ExecutionClosureStatusCliOptions;
}): void => {
  params.options.requireAdapterReadiness = true;
};
