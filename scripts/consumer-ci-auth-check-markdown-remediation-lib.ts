import type { BuildConsumerCiAuthMarkdownParams } from './consumer-ci-auth-check-contract';

export const buildConsumerCiAuthRemediationLines = (
  source: BuildConsumerCiAuthMarkdownParams
): ReadonlyArray<string> => {
  if (source.verdict === 'READY') {
    return ['## Remediation', '', '- No remediation required.', ''];
  }

  const lines = ['## Remediation', ''];
  if (!source.authStatus.ok) {
    lines.push('- Authenticate GitHub CLI: `gh auth login`');
  }
  if (source.missingScopes.includes('user')) {
    lines.push('- Refresh auth adding `user` scope: `gh auth refresh -h github.com -s user`');
  }
  if (!source.actionsPermissions.ok) {
    lines.push(
      '- Verify repository Actions settings endpoint: `gh api repos/<owner>/<repo>/actions/permissions`'
    );
  }
  if (!source.billing.ok) {
    lines.push(
      '- Re-run billing probe after scope refresh: `gh api users/<owner>/settings/billing/actions`'
    );
  }
  lines.push('');

  return lines;
};
