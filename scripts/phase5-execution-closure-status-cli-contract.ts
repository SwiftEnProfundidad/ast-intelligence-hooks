export type Phase5ExecutionClosureStatusCliOptions = {
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
};

export const DEFAULT_PHASE5_BLOCKERS_REPORT_FILE =
  '.audit-reports/phase5/phase5-blockers-readiness.md';
export const DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE =
  '.audit-reports/consumer-triage/consumer-startup-unblock-status.md';
export const DEFAULT_ADAPTER_READINESS_REPORT_FILE = '.audit-reports/adapter/adapter-readiness.md';
export const DEFAULT_PHASE5_EXECUTION_CLOSURE_STATUS_OUT_FILE =
  '.audit-reports/phase5/phase5-execution-closure-status.md';

export const createDefaultPhase5ExecutionClosureStatusCliOptions =
  (): Phase5ExecutionClosureStatusCliOptions => ({
    phase5BlockersReportFile: DEFAULT_PHASE5_BLOCKERS_REPORT_FILE,
    consumerUnblockReportFile: DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE,
    adapterReadinessReportFile: DEFAULT_ADAPTER_READINESS_REPORT_FILE,
    outFile: DEFAULT_PHASE5_EXECUTION_CLOSURE_STATUS_OUT_FILE,
    requireAdapterReadiness: false,
  });
