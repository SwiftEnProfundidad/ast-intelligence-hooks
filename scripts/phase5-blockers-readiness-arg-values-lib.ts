import type { Phase5BlockersReadinessCliOptions } from './phase5-blockers-readiness-cli-lib';

export type Phase5BlockersReadinessValueArg =
  '--adapter-report'
  | '--consumer-triage-report'
  | '--out';

export const isPhase5BlockersReadinessValueArg = (
  arg: string
): arg is Phase5BlockersReadinessValueArg =>
  arg === '--adapter-report' || arg === '--consumer-triage-report' || arg === '--out';

export const applyPhase5BlockersReadinessValueArg = (params: {
  options: Phase5BlockersReadinessCliOptions;
  arg: Phase5BlockersReadinessValueArg;
  value: string;
}): void => {
  if (params.arg === '--adapter-report') {
    params.options.adapterReportFile = params.value;
    return;
  }
  if (params.arg === '--consumer-triage-report') {
    params.options.consumerTriageReportFile = params.value;
    return;
  }
  params.options.outFile = params.value;
};
