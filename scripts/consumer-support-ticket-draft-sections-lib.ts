import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-parser-lib';

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
): ReadonlyArray<string> => [
  '## Problem Summary',
  '',
  '- Runs consistently end with `conclusion: startup_failure`.',
  `- startup_failure_runs observed: ${support.startupFailureRuns ?? 'unknown'}.`,
  `- run metadata path: ${support.path ?? 'unknown'}.`,
  `- jobs.total_count: ${support.jobsCount ?? 'unknown'}.`,
  `- artifacts.total_count: ${support.artifactsCount ?? 'unknown'}.`,
  `- repo visibility: ${support.repoVisibility ?? 'unknown'}.`,
  '',
];

export const buildSupportTicketEvidenceLines = (
  support: ParsedSupportBundle
): ReadonlyArray<string> => {
  const runUrls = support.runUrls.slice(0, 3);
  if (runUrls.length === 0) {
    return [
      '## Evidence',
      '',
      '- No run URLs extracted from support bundle; attach report file directly.',
      '',
    ];
  }

  return ['## Evidence', '', 'Sample run URLs:', ...runUrls.map((runUrl) => `- ${runUrl}`), ''];
};

export const buildSupportTicketAuthLines = (auth: ParsedAuthReport): ReadonlyArray<string> => {
  const lines = [
    '## Auth and Billing Probe',
    '',
    `- auth verdict: ${auth.verdict ?? 'unknown'}`,
    `- detected scopes: ${auth.detectedScopes ?? 'unknown'}`,
    `- missing scopes: ${auth.missingScopes ?? 'unknown'}`,
  ];

  if (auth.billingError) {
    lines.push(`- billing probe error: ${auth.billingError}`);
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

export const buildSupportTicketAttachmentLines = (params: {
  supportBundlePath: string;
  authReportPath: string;
}): ReadonlyArray<string> => [
  '## Attachments',
  '',
  `- ${params.supportBundlePath}`,
  `- ${params.authReportPath}`,
  '- .audit-reports/consumer-triage/consumer-ci-artifacts-report.md',
  '- .audit-reports/consumer-triage/consumer-workflow-lint-report.md',
  '- docs/validation/archive/skills-rollout-r_go-startup-fix-experiment.md',
  '- docs/validation/archive/private-actions-healthcheck.md',
  '',
];
