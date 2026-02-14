export type ConsumerSupportTicketCliOptions = {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  outFile: string;
};

export const DEFAULT_CONSUMER_SUPPORT_TICKET_REPO = 'owner/repo';
export const DEFAULT_CONSUMER_SUPPORT_TICKET_SUPPORT_BUNDLE_FILE =
  '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md';
export const DEFAULT_CONSUMER_SUPPORT_TICKET_AUTH_REPORT_FILE =
  '.audit-reports/consumer-triage/consumer-ci-auth-check.md';
export const DEFAULT_CONSUMER_SUPPORT_TICKET_OUT_FILE =
  '.audit-reports/consumer-triage/consumer-support-ticket-draft.md';
