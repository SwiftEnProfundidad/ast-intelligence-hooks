import { type BuildConsumerCiAuthMarkdownParams } from './consumer-ci-auth-check-contract';
import {
  buildConsumerCiAuthHeaderLines,
  buildConsumerCiAuthJsonProbeLines,
  buildConsumerCiAuthRemediationLines,
  buildConsumerCiAuthStatusLines,
} from './consumer-ci-auth-check-markdown-sections-lib';

export const buildConsumerCiAuthMarkdown = (
  params: BuildConsumerCiAuthMarkdownParams
): string => {
  const lines = [
    ...buildConsumerCiAuthHeaderLines({
      generatedAt: new Date().toISOString(),
      source: params,
    }),
    ...buildConsumerCiAuthStatusLines(params.authStatus),
    ...buildConsumerCiAuthJsonProbeLines({
      title: '## Repository Actions Permissions Probe',
      probe: params.actionsPermissions,
    }),
    ...buildConsumerCiAuthJsonProbeLines({
      title: '## Billing Probe',
      probe: params.billing,
    }),
    ...buildConsumerCiAuthRemediationLines(params),
  ];

  return `${lines.join('\n')}\n`;
};
