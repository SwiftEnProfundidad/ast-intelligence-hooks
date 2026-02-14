import type { Phase5ExecutionClosureCliOptions } from './phase5-execution-closure-runner-contract';

export type Phase5ExecutionClosureValueArg =
  '--repo'
  | '--limit'
  | '--out-dir'
  | '--repo-path'
  | '--actionlint-bin';

export const isPhase5ExecutionClosureValueArg = (
  arg: string
): arg is Phase5ExecutionClosureValueArg =>
  arg === '--repo' ||
  arg === '--limit' ||
  arg === '--out-dir' ||
  arg === '--repo-path' ||
  arg === '--actionlint-bin';

const assignPhase5ExecutionClosureStringArg = (params: {
  options: Phase5ExecutionClosureCliOptions;
  arg: Exclude<Phase5ExecutionClosureValueArg, '--limit'>;
  value: string;
}): void => {
  if (params.arg === '--repo') {
    params.options.repo = params.value;
    return;
  }
  if (params.arg === '--out-dir') {
    params.options.outDir = params.value;
    return;
  }
  if (params.arg === '--repo-path') {
    params.options.repoPath = params.value;
    return;
  }
  params.options.actionlintBin = params.value;
};

const parsePositiveInteger = (value: string, flag: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${flag} value: ${value}`);
  }
  return parsed;
};

export const applyPhase5ExecutionClosureValueArg = (params: {
  options: Phase5ExecutionClosureCliOptions;
  arg: Phase5ExecutionClosureValueArg;
  value: string;
}): void => {
  if (params.arg === '--limit') {
    params.options.limit = parsePositiveInteger(params.value, '--limit');
    return;
  }

  assignPhase5ExecutionClosureStringArg({
    options: params.options,
    arg: params.arg,
    value: params.value,
  });
};
