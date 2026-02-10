import type { Phase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';

export type Phase5ExternalHandoffFlagArg =
  '--require-artifact-urls'
  | '--require-mock-ab-report';

export const isPhase5ExternalHandoffFlagArg = (
  arg: string
): arg is Phase5ExternalHandoffFlagArg =>
  arg === '--require-artifact-urls' || arg === '--require-mock-ab-report';

export const applyPhase5ExternalHandoffFlagArg = (params: {
  options: Phase5ExternalHandoffCliOptions;
  arg: Phase5ExternalHandoffFlagArg;
}): void => {
  if (params.arg === '--require-artifact-urls') {
    params.options.requireArtifactUrls = true;
    return;
  }
  params.options.requireMockAbReport = true;
};
