import {
  REQUIRED_CONSUMER_CI_AUTH_SCOPES,
  type BuildConsumerCiAuthMarkdownParams,
} from './consumer-ci-auth-check-contract';

export const buildConsumerCiAuthMarkdown = (
  params: BuildConsumerCiAuthMarkdownParams
): string => {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push('# Consumer CI Auth Check');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- target_repo: \`${params.options.repo}\``);
  lines.push(`- required_scopes: ${REQUIRED_CONSUMER_CI_AUTH_SCOPES.join(', ')}`);
  lines.push(
    `- detected_scopes: ${params.scopes.length > 0 ? params.scopes.join(', ') : '(none)'}`
  );
  lines.push(
    `- missing_scopes: ${params.missingScopes.length > 0 ? params.missingScopes.join(', ') : '(none)'}`
  );
  lines.push(`- verdict: ${params.verdict}`);
  lines.push('');

  lines.push('## GH Auth Status');
  lines.push('');
  if (params.authStatus.ok) {
    lines.push('```text');
    lines.push((params.authStatus.output ?? '').trimEnd());
    lines.push('```');
  } else {
    lines.push(`- error: ${params.authStatus.error}`);
  }
  lines.push('');

  lines.push('## Repository Actions Permissions Probe');
  lines.push('');
  if (params.actionsPermissions.ok && params.actionsPermissions.data) {
    lines.push('```json');
    lines.push(JSON.stringify(params.actionsPermissions.data, null, 2));
    lines.push('```');
  } else {
    lines.push(`- error: ${params.actionsPermissions.error}`);
  }
  lines.push('');

  lines.push('## Billing Probe');
  lines.push('');
  if (params.billing.ok && params.billing.data) {
    lines.push('```json');
    lines.push(JSON.stringify(params.billing.data, null, 2));
    lines.push('```');
  } else {
    lines.push(`- error: ${params.billing.error}`);
  }
  lines.push('');

  lines.push('## Remediation');
  lines.push('');
  if (params.verdict === 'READY') {
    lines.push('- No remediation required.');
  } else {
    if (!params.authStatus.ok) {
      lines.push('- Authenticate GitHub CLI: `gh auth login`');
    }
    if (params.missingScopes.includes('user')) {
      lines.push('- Refresh auth adding `user` scope: `gh auth refresh -h github.com -s user`');
    }
    if (!params.actionsPermissions.ok) {
      lines.push(
        '- Verify repository Actions settings endpoint: `gh api repos/<owner>/<repo>/actions/permissions`'
      );
    }
    if (!params.billing.ok) {
      lines.push(
        '- Re-run billing probe after scope refresh: `gh api users/<owner>/settings/billing/actions`'
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
