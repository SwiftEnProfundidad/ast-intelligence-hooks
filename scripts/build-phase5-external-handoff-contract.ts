export type Phase5ExternalHandoffCliOptions = {
  repo: string;
  phase5StatusReportFile: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  mockAbReportFile: string;
  runReportFile: string;
  outFile: string;
  artifactUrls: string[];
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
};

export const DEFAULT_REPO = 'owner/repo';
export const DEFAULT_PHASE5_STATUS_REPORT_FILE =
  '.audit-reports/phase5/phase5-execution-closure-status.md';
export const DEFAULT_PHASE5_BLOCKERS_REPORT_FILE =
  '.audit-reports/phase5/phase5-blockers-readiness.md';
export const DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE =
  '.audit-reports/phase5/consumer-startup-unblock-status.md';
export const DEFAULT_MOCK_AB_REPORT_FILE = '.audit-reports/phase5/mock-consumer-ab-report.md';
export const DEFAULT_RUN_REPORT_FILE = '.audit-reports/phase5/phase5-execution-closure-run-report.md';
export const DEFAULT_OUT_FILE = '.audit-reports/phase5/phase5-external-handoff.md';

export const createDefaultPhase5ExternalHandoffCliOptions =
  (): Phase5ExternalHandoffCliOptions => {
    return {
      repo: DEFAULT_REPO,
      phase5StatusReportFile: DEFAULT_PHASE5_STATUS_REPORT_FILE,
      phase5BlockersReportFile: DEFAULT_PHASE5_BLOCKERS_REPORT_FILE,
      consumerUnblockReportFile: DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE,
      mockAbReportFile: DEFAULT_MOCK_AB_REPORT_FILE,
      runReportFile: DEFAULT_RUN_REPORT_FILE,
      outFile: DEFAULT_OUT_FILE,
      artifactUrls: [],
      requireArtifactUrls: false,
      requireMockAbReport: false,
    };
  };
