import type { Phase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';

const readRequiredValue = (
  args: ReadonlyArray<string>,
  index: number,
  flag: string
): string => {
  const value = args[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
};

export const applyPhase5ExternalHandoffArg = (params: {
  args: ReadonlyArray<string>;
  index: number;
  options: Phase5ExternalHandoffCliOptions;
}): number => {
  const arg = params.args[params.index];

  if (arg === '--repo') {
    params.options.repo = readRequiredValue(params.args, params.index, '--repo');
    return 1;
  }

  if (arg === '--phase5-status-report') {
    params.options.phase5StatusReportFile = readRequiredValue(
      params.args,
      params.index,
      '--phase5-status-report'
    );
    return 1;
  }

  if (arg === '--phase5-blockers-report') {
    params.options.phase5BlockersReportFile = readRequiredValue(
      params.args,
      params.index,
      '--phase5-blockers-report'
    );
    return 1;
  }

  if (arg === '--consumer-unblock-report') {
    params.options.consumerUnblockReportFile = readRequiredValue(
      params.args,
      params.index,
      '--consumer-unblock-report'
    );
    return 1;
  }

  if (arg === '--mock-ab-report') {
    params.options.mockAbReportFile = readRequiredValue(
      params.args,
      params.index,
      '--mock-ab-report'
    );
    return 1;
  }

  if (arg === '--run-report') {
    params.options.runReportFile = readRequiredValue(params.args, params.index, '--run-report');
    return 1;
  }

  if (arg === '--out') {
    params.options.outFile = readRequiredValue(params.args, params.index, '--out');
    return 1;
  }

  if (arg === '--artifact-url') {
    params.options.artifactUrls.push(
      readRequiredValue(params.args, params.index, '--artifact-url')
    );
    return 1;
  }

  if (arg === '--require-artifact-urls') {
    params.options.requireArtifactUrls = true;
    return 0;
  }

  if (arg === '--require-mock-ab-report') {
    params.options.requireMockAbReport = true;
    return 0;
  }

  return -1;
};
