import type { ParsedSupportBundle } from './consumer-support-ticket-parser-lib';

const hasObservedStartupFailures = (support: ParsedSupportBundle): boolean =>
  support.startupFailureRuns !== undefined && support.startupFailureRuns !== '0';

const hasEmptyJobGraph = (support: ParsedSupportBundle): boolean =>
  support.jobsCount === '0' && support.artifactsCount === '0';

const repositoryVisibilityLabel = (support: ParsedSupportBundle): string =>
  support.repoVisibility ?? 'unknown';

const buildSupportTicketSubjectLine = (support: ParsedSupportBundle): string => {
  const visibility = repositoryVisibilityLabel(support);

  if (hasObservedStartupFailures(support) && hasEmptyJobGraph(support)) {
    return `Persistent GitHub Actions \`startup_failure\` before job creation in ${visibility} repository`;
  }

  if (hasObservedStartupFailures(support)) {
    return `GitHub Actions \`startup_failure\` diagnostics request for ${visibility} repository`;
  }

  return `Consumer CI diagnostics request for ${visibility} repository`;
};

const buildStartupSummaryLine = (support: ParsedSupportBundle): string =>
  hasObservedStartupFailures(support)
    ? '- Runs consistently end with `conclusion: startup_failure`.'
    : '- Current support bundle does not show `startup_failure` conclusions in the sampled runs.';

const buildRequestLine = (support: ParsedSupportBundle): string => {
  const visibility = repositoryVisibilityLabel(support);

  if (hasObservedStartupFailures(support) && visibility === 'private' && hasEmptyJobGraph(support)) {
    return 'Please verify account/repository-level controls for private Actions execution (billing, policy, quotas, or internal restrictions) and provide the exact root cause for startup_failure before job graph creation.';
  }

  if (hasObservedStartupFailures(support)) {
    return 'Please review the attached diagnostics and identify the exact root cause behind the observed startup_failure runs in this repository.';
  }

  return 'Please review the attached diagnostics and identify the exact root cause reflected in the support bundle. The current evidence does not show startup_failure runs, so the next step is to reconcile the reported failure mode with the attached reports.';
};

export const buildSupportTicketHeaderLines = (params: {
  generatedAt: string;
  repo: string;
  supportBundlePath: string;
  authReportPath: string;
  support: ParsedSupportBundle;
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
  buildSupportTicketSubjectLine(params.support),
  '',
];

export const buildSupportTicketProblemSummaryLines = (
  support: ParsedSupportBundle
): ReadonlyArray<string> => {
  const lines: string[] = [
    '## Problem Summary',
    '',
    buildStartupSummaryLine(support),
    `- startup_failure_runs observed: ${support.startupFailureRuns ?? 'unknown'}.`,
    `- startup_stalled_runs observed: ${support.startupStalledRuns ?? 'unknown'}.`,
    `- oldest_queued_run_age_minutes observed: ${support.oldestQueuedRunAgeMinutes ?? 'unknown'}.`,
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

export const buildSupportTicketRequestLines = (
  support: ParsedSupportBundle
): ReadonlyArray<string> => [
  '## Request',
  '',
  buildRequestLine(support),
  '',
];
