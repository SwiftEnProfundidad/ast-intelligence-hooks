import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

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

export const parseConsumerSupportTicketArgs = (
  args: ReadonlyArray<string>
): ConsumerSupportTicketCliOptions => {
  const options: ConsumerSupportTicketCliOptions = {
    repo: DEFAULT_CONSUMER_SUPPORT_TICKET_REPO,
    supportBundleFile: DEFAULT_CONSUMER_SUPPORT_TICKET_SUPPORT_BUNDLE_FILE,
    authReportFile: DEFAULT_CONSUMER_SUPPORT_TICKET_AUTH_REPORT_FILE,
    outFile: DEFAULT_CONSUMER_SUPPORT_TICKET_OUT_FILE,
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

export const resolveRequiredConsumerSupportTicketFile = (
  cwd: string,
  pathLike: string
): string => {
  const absolute = resolve(cwd, pathLike);
  if (!existsSync(absolute)) {
    throw new Error(`Input file not found: ${pathLike}`);
  }
  return absolute;
};
