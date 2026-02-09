import type { Phase5ExecutionClosureCliOptions } from './phase5-execution-closure-runner-contract';

const readRequiredValue = (params: {
  args: ReadonlyArray<string>;
  index: number;
  flag: string;
}): string => {
  const value = params.args[params.index + 1];
  if (!value) {
    throw new Error(`Missing value for ${params.flag}`);
  }
  return value;
};

const parseRequiredPositiveInteger = (params: {
  args: ReadonlyArray<string>;
  index: number;
  flag: string;
}): number => {
  const value = readRequiredValue(params);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${params.flag} value: ${value}`);
  }
  return parsed;
};

const assignArgWithValue = (params: {
  options: Phase5ExecutionClosureCliOptions;
  args: ReadonlyArray<string>;
  index: number;
  arg: string;
}): boolean => {
  if (params.arg === '--repo') {
    params.options.repo = readRequiredValue({
      args: params.args,
      index: params.index,
      flag: '--repo',
    });
    return true;
  }
  if (params.arg === '--limit') {
    params.options.limit = parseRequiredPositiveInteger({
      args: params.args,
      index: params.index,
      flag: '--limit',
    });
    return true;
  }
  if (params.arg === '--out-dir') {
    params.options.outDir = readRequiredValue({
      args: params.args,
      index: params.index,
      flag: '--out-dir',
    });
    return true;
  }
  if (params.arg === '--repo-path') {
    params.options.repoPath = readRequiredValue({
      args: params.args,
      index: params.index,
      flag: '--repo-path',
    });
    return true;
  }
  if (params.arg === '--actionlint-bin') {
    params.options.actionlintBin = readRequiredValue({
      args: params.args,
      index: params.index,
      flag: '--actionlint-bin',
    });
    return true;
  }
  return false;
};

const assignBooleanArg = (params: {
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

export const applyPhase5ExecutionClosureArg = (params: {
  options: Phase5ExecutionClosureCliOptions;
  args: ReadonlyArray<string>;
  index: number;
}): number => {
  const arg = params.args[params.index];

  if (
    assignArgWithValue({
      options: params.options,
      args: params.args,
      index: params.index,
      arg,
    })
  ) {
    return params.index + 1;
  }

  if (
    assignBooleanArg({
      options: params.options,
      arg,
    })
  ) {
    return params.index;
  }

  throw new Error(`Unknown argument: ${arg}`);
};
