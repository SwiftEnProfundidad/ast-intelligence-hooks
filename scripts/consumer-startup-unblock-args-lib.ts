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

export const parseConsumerStartupUnblockArgs = (
  args: ReadonlyArray<string>
): ConsumerStartupUnblockCliOptions => {
  const options: ConsumerStartupUnblockCliOptions = {
    repo: DEFAULT_CONSUMER_STARTUP_UNBLOCK_REPO,
    supportBundleFile: DEFAULT_CONSUMER_STARTUP_UNBLOCK_SUPPORT_BUNDLE_FILE,
    authReportFile: DEFAULT_CONSUMER_STARTUP_UNBLOCK_AUTH_REPORT_FILE,
    workflowLintReportFile: DEFAULT_CONSUMER_STARTUP_UNBLOCK_WORKFLOW_LINT_FILE,
    outFile: DEFAULT_CONSUMER_STARTUP_UNBLOCK_OUT_FILE,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }

    if (arg === '--support-bundle') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --support-bundle');
      }
      options.supportBundleFile = value;
      index += 1;
      continue;
    }

    if (arg === '--auth-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --auth-report');
      }
      options.authReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--workflow-lint-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --workflow-lint-report');
      }
      options.workflowLintReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
