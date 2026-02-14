import type { Phase5ExecutionClosureCliOptions } from './phase5-execution-closure-runner-contract';

export const assignPhase5ExecutionClosureBooleanArg = (params: {
  options: Phase5ExecutionClosureCliOptions;
  arg: string;
}): boolean => {
  if (params.arg === '--skip-workflow-lint') {
    params.options.runWorkflowLint = false;
    return true;
  }
  if (params.arg === '--skip-auth-preflight') {
    params.options.includeAuthPreflight = false;
    return true;
  }
  if (params.arg === '--skip-adapter') {
    params.options.includeAdapter = false;
    return true;
  }
  if (params.arg === '--require-adapter-readiness') {
    params.options.requireAdapterReadiness = true;
    return true;
  }
  if (params.arg === '--mock-consumer') {
    params.options.useMockConsumerTriage = true;
    return true;
  }
  if (params.arg === '--dry-run') {
    params.options.dryRun = true;
    return true;
  }
  return false;
};
