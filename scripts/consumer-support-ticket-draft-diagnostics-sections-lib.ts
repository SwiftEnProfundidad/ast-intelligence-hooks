import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-parser-lib';

const buildSiblingReportPath = (basePath: string, reportName: string): string => {
  const separatorIndex = basePath.lastIndexOf('/');
  if (separatorIndex < 0) {
    return reportName;
  }
  return `${basePath.slice(0, separatorIndex)}/${reportName}`;
};

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
}): ReadonlyArray<string> => {
  const attachmentPaths = [
    params.supportBundlePath,
    params.authReportPath,
    buildSiblingReportPath(params.supportBundlePath, 'consumer-ci-artifacts-report.md'),
    buildSiblingReportPath(params.supportBundlePath, 'consumer-workflow-lint-report.md'),
    'docs/validation/archive/skills-rollout-mock_consumer-startup-fix-experiment.md',
    'docs/validation/archive/private-actions-healthcheck.md',
  ];

  const uniqueAttachmentPaths = attachmentPaths.filter(
    (path, index) => attachmentPaths.indexOf(path) === index
  );

  return [
    '## Attachments',
    '',
    ...uniqueAttachmentPaths.map((path) => `- ${path}`),
    '',
  ];
};
