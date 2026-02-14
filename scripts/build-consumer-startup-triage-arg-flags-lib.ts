import type { BuildConsumerStartupTriageCliOptions } from './build-consumer-startup-triage-contract';

export type BuildConsumerStartupTriageFlagArg =
  '--skip-workflow-lint'
  | '--skip-auth-check'
  | '--dry-run';

export const isBuildConsumerStartupTriageFlagArg = (
  arg: string
): arg is BuildConsumerStartupTriageFlagArg =>
  arg === '--skip-workflow-lint' || arg === '--skip-auth-check' || arg === '--dry-run';

export const applyBuildConsumerStartupTriageFlagArg = (params: {
  options: BuildConsumerStartupTriageCliOptions;
  arg: BuildConsumerStartupTriageFlagArg;
}): void => {
  if (params.arg === '--skip-workflow-lint') {
    params.options.runWorkflowLint = false;
    return;
  }
  if (params.arg === '--skip-auth-check') {
    params.options.includeAuthCheck = false;
    return;
  }
  params.options.dryRun = true;
};
