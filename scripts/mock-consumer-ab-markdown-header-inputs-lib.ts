import type { MockConsumerAbMarkdownParams } from './mock-consumer-ab-markdown-contract';

export const buildMockConsumerAbHeaderAndInputs = (
  source: MockConsumerAbMarkdownParams,
  verdict: 'READY' | 'BLOCKED'
): ReadonlyArray<string> => [
  '# Mock Consumer A/B Validation Report',
  '',
  `- generated_at: ${source.generatedAt}`,
  `- target_repo: \`${source.repo}\``,
  '- source: local_mock_consumer_validation',
  `- verdict: ${verdict}`,
  '',
  '## Inputs',
  '',
  `- block_summary: \`${source.blockSummaryFile}\``,
  `- minimal_summary: \`${source.minimalSummaryFile}\``,
  `- block_evidence: \`${source.blockEvidenceFile}\``,
  `- minimal_evidence: \`${source.minimalEvidenceFile}\``,
  '',
];
