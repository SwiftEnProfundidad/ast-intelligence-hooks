import type { Phase5ExecutionClosureStatusCliOptions } from './phase5-execution-closure-status-cli-contract';

export type Phase5ExecutionClosureStatusValueArg =
  '--phase5-blockers-report'
  | '--consumer-unblock-report'
  | '--adapter-readiness-report'
  | '--out';

export const isPhase5ExecutionClosureStatusValueArg = (
  arg: string
): arg is Phase5ExecutionClosureStatusValueArg =>
  arg === '--phase5-blockers-report' ||
  arg === '--consumer-unblock-report' ||
  arg === '--adapter-readiness-report' ||
  arg === '--out';

export const applyPhase5ExecutionClosureStatusValueArg = (params: {
  options: Phase5ExecutionClosureStatusCliOptions;
  arg: Phase5ExecutionClosureStatusValueArg;
  value: string;
}): void => {
  if (params.arg === '--phase5-blockers-report') {
    params.options.phase5BlockersReportFile = params.value;
    return;
  }
  if (params.arg === '--consumer-unblock-report') {
    params.options.consumerUnblockReportFile = params.value;
    return;
  }
  if (params.arg === '--adapter-readiness-report') {
    params.options.adapterReadinessReportFile = params.value;
    return;
  }
  params.options.outFile = params.value;
};
