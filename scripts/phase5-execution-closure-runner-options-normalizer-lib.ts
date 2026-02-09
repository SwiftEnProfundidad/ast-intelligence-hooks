import type { Phase5ExecutionClosureCliOptions } from './phase5-execution-closure-runner-contract';

export const normalizePhase5ExecutionClosureOptions = (
  options: Phase5ExecutionClosureCliOptions
): Phase5ExecutionClosureCliOptions => {
  if (!options.repo) {
    throw new Error('Missing required argument --repo <owner/repo>');
  }

  if (options.useMockConsumerTriage) {
    options.includeAuthPreflight = false;
    options.runWorkflowLint = false;
    if (!options.requireAdapterReadiness) {
      options.includeAdapter = false;
    }
  }

  return options;
};
