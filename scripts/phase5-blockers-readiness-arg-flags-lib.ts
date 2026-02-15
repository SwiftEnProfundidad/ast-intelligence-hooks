import type { Phase5BlockersReadinessCliOptions } from './phase5-blockers-readiness-cli-contract';

export type Phase5BlockersReadinessFlagArg = '--require-adapter-report';

export const isPhase5BlockersReadinessFlagArg = (
  arg: string
): arg is Phase5BlockersReadinessFlagArg => arg === '--require-adapter-report';

export const applyPhase5BlockersReadinessFlagArg = (params: {
  options: Phase5BlockersReadinessCliOptions;
}): void => {
  params.options.requireAdapterReport = true;
};
