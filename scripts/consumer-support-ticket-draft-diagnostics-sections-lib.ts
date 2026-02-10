import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-parser-lib';

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
