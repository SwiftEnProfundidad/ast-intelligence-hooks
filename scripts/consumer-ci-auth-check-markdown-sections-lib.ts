import {
  REQUIRED_CONSUMER_CI_AUTH_SCOPES,
  type BuildConsumerCiAuthMarkdownParams,
  type JsonResult,
} from './consumer-ci-auth-check-contract';

export const buildConsumerCiAuthHeaderLines = (params: {
  generatedAt: string;
  source: BuildConsumerCiAuthMarkdownParams;
}): ReadonlyArray<string> => [
  '# Consumer CI Auth Check',
  '',
  `- generated_at: ${params.generatedAt}`,
  `- target_repo: \`${params.source.options.repo}\``,
  `- required_scopes: ${REQUIRED_CONSUMER_CI_AUTH_SCOPES.join(', ')}`,
  `- detected_scopes: ${
    params.source.scopes.length > 0 ? params.source.scopes.join(', ') : '(none)'
  }`,
  `- missing_scopes: ${
    params.source.missingScopes.length > 0 ? params.source.missingScopes.join(', ') : '(none)'
  }`,
  `- verdict: ${params.source.verdict}`,
  '',
];

export const buildConsumerCiAuthStatusLines = (
  authStatus: BuildConsumerCiAuthMarkdownParams['authStatus']
): ReadonlyArray<string> => {
  if (authStatus.ok) {
    return ['## GH Auth Status', '', '```text', (authStatus.output ?? '').trimEnd(), '```', ''];
  }
  return ['## GH Auth Status', '', `- error: ${authStatus.error}`, ''];
};

export const buildConsumerCiAuthJsonProbeLines = <T>(params: {
  title: string;
  probe: JsonResult<T>;
}): ReadonlyArray<string> => {
  if (params.probe.ok && params.probe.data) {
    return [
      params.title,
      '',
      '```json',
      JSON.stringify(params.probe.data, null, 2),
      '```',
      '',
    ];
  }

  return [params.title, '', `- error: ${params.probe.error}`, ''];
};

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
