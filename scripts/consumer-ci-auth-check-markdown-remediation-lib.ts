import type { BuildConsumerCiAuthMarkdownParams } from './consumer-ci-auth-check-contract';

export const buildConsumerCiAuthRemediationLines = (
  source: BuildConsumerCiAuthMarkdownParams
): ReadonlyArray<string> => {
  if (source.verdict === 'READY') {
    if (!source.billing.ok) {
      return [
        '## Remediation',
        '',
        '- No remediation required for CI unblock.',
        '- Billing probe is optional for startup unblock; keep this as informational unless account diagnostics are required.',
        '',
      ];
    }
    return ['## Remediation', '', '- No remediation required.', ''];
  }

  const lines = ['## Remediation', ''];
  if (!source.authStatus.ok) {
    lines.push('- Authenticate GitHub CLI: `gh auth login`');
  }
  if (!source.actionsPermissions.ok) {
    lines.push(
      '- Verify repository Actions settings endpoint: `gh api repos/<owner>/<repo>/actions/permissions`'
    );
  }
  if (!source.billing.ok) {
    lines.push(
      '- Billing probe is optional for startup unblock; keep this as informational unless account diagnostics are required.'
    );
  }
  lines.push('');

  return lines;
};
