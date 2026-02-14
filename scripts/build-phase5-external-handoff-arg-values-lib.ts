import type { Phase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';

export type Phase5ExternalHandoffValueArg =
  | '--repo'
  | '--phase5-status-report'
  | '--phase5-blockers-report'
  | '--consumer-unblock-report'
  | '--mock-ab-report'
  | '--run-report'
  | '--out'
  | '--artifact-url';

export const isPhase5ExternalHandoffValueArg = (
  arg: string
): arg is Phase5ExternalHandoffValueArg =>
  arg === '--repo' ||
  arg === '--phase5-status-report' ||
  arg === '--phase5-blockers-report' ||
  arg === '--consumer-unblock-report' ||
  arg === '--mock-ab-report' ||
  arg === '--run-report' ||
  arg === '--out' ||
  arg === '--artifact-url';

export const applyPhase5ExternalHandoffValueArg = (params: {
  options: Phase5ExternalHandoffCliOptions;
  arg: Phase5ExternalHandoffValueArg;
  value: string;
}): void => {
  if (params.arg === '--repo') {
    params.options.repo = params.value;
    return;
  }
  if (params.arg === '--phase5-status-report') {
    params.options.phase5StatusReportFile = params.value;
    return;
  }
  if (params.arg === '--phase5-blockers-report') {
    params.options.phase5BlockersReportFile = params.value;
    return;
  }
  if (params.arg === '--consumer-unblock-report') {
    params.options.consumerUnblockReportFile = params.value;
    return;
  }
  if (params.arg === '--mock-ab-report') {
    params.options.mockAbReportFile = params.value;
    return;
  }
  if (params.arg === '--run-report') {
    params.options.runReportFile = params.value;
    return;
  }
  if (params.arg === '--out') {
    params.options.outFile = params.value;
    return;
  }
  params.options.artifactUrls.push(params.value);
};
