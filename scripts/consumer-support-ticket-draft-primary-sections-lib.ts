import type { ParsedSupportBundle } from './consumer-support-ticket-parser-lib';

export const buildSupportTicketHeaderLines = (params: {
  generatedAt: string;
  repo: string;
  supportBundlePath: string;
  authReportPath: string;
}): ReadonlyArray<string> => [
  '# Consumer CI Support Ticket Draft',
  '',
  `- generated_at: ${params.generatedAt}`,
  `- repository: \`${params.repo}\``,
  `- source_support_bundle: \`${params.supportBundlePath}\``,
  `- source_auth_report: \`${params.authReportPath}\``,
  '',
  '## Subject',
  '',
  'Persistent GitHub Actions `startup_failure` with no jobs in private repository',
  '',
];

export const buildSupportTicketProblemSummaryLines = (
  support: ParsedSupportBundle
): ReadonlyArray<string> => {
  const lines: string[] = [
    '## Problem Summary',
    '',
    '- Runs consistently end with `conclusion: startup_failure`.',
    `- startup_failure_runs observed: ${support.startupFailureRuns ?? 'unknown'}.`,
    `- run metadata path: ${support.path ?? 'unknown'}.`,
    `- jobs.total_count: ${support.jobsCount ?? 'unknown'}.`,
    `- artifacts.total_count: ${support.artifactsCount ?? 'unknown'}.`,
    `- repo visibility: ${support.repoVisibility ?? 'unknown'}.`,
  ];

  if (support.jobsCount === '0' && support.artifactsCount === '0') {
    lines.push('- Latest runs remain queued/stuck before any job is created (job graph is empty).');
  }

  lines.push('');
  return lines;
};

export const buildSupportTicketRequestLines = (): ReadonlyArray<string> => [
  '## Request',
  '',
  'Please verify account/repository-level controls for private Actions execution (billing, policy, quotas, or internal restrictions) and provide the exact root cause for startup_failure before job graph creation.',
  '',
];
