export type ConsumerStartupUnblockCliOptions = {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  workflowLintReportFile: string;
  outFile: string;
};

export const DEFAULT_CONSUMER_STARTUP_UNBLOCK_REPO = 'owner/repo';
export const DEFAULT_CONSUMER_STARTUP_UNBLOCK_SUPPORT_BUNDLE_FILE =
  '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md';
export const DEFAULT_CONSUMER_STARTUP_UNBLOCK_AUTH_REPORT_FILE =
  '.audit-reports/consumer-triage/consumer-ci-auth-check.md';
export const DEFAULT_CONSUMER_STARTUP_UNBLOCK_WORKFLOW_LINT_FILE =
  '.audit-reports/consumer-triage/consumer-workflow-lint-report.md';
export const DEFAULT_CONSUMER_STARTUP_UNBLOCK_OUT_FILE =
  '.audit-reports/consumer-triage/consumer-startup-unblock-status.md';
