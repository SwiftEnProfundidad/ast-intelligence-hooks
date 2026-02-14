import {
  REQUIRED_CONSUMER_CI_AUTH_SCOPES,
  type BuildConsumerCiAuthMarkdownParams,
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
