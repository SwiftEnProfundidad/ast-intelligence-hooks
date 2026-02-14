import type { BuildConsumerStartupTriageCliOptions } from './build-consumer-startup-triage-contract';

export type BuildConsumerStartupTriageValueArg =
  | '--repo'
  | '--limit'
  | '--out-dir'
  | '--repo-path'
  | '--actionlint-bin';

export const isBuildConsumerStartupTriageValueArg = (
  arg: string
): arg is BuildConsumerStartupTriageValueArg =>
  arg === '--repo' ||
  arg === '--limit' ||
  arg === '--out-dir' ||
  arg === '--repo-path' ||
  arg === '--actionlint-bin';

export const applyBuildConsumerStartupTriageValueArg = (params: {
  options: BuildConsumerStartupTriageCliOptions;
  arg: BuildConsumerStartupTriageValueArg;
  value: string;
}): void => {
  if (params.arg === '--repo') {
    params.options.repo = params.value;
    return;
  }
  if (params.arg === '--limit') {
    const parsed = Number.parseInt(params.value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Invalid --limit value: ${params.value}`);
    }
    params.options.limit = parsed;
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
