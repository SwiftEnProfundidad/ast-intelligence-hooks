import type { Phase5ExecutionClosureOptions } from './phase5-execution-closure-plan-contract';

export const validatePhase5ExecutionClosureOptions = (
  options: Phase5ExecutionClosureOptions
): void => {
  if (!options.repo.trim()) {
    throw new Error('Missing required option: repo');
  }

  if (options.requireAdapterReadiness && !options.includeAdapter) {
    throw new Error(
      'Cannot require adapter readiness when adapter flow is disabled (--skip-adapter).'
    );
  }
};
