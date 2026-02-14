import type { MockConsumerAbVerdict } from './mock-consumer-ab-markdown-contract';

export const buildMockConsumerAbNextActionsLines = (
  verdict: MockConsumerAbVerdict
): ReadonlyArray<string> => {
  if (verdict === 'READY') {
    return [
      '## Next Actions',
      '',
      '- Mock consumer A/B validation is stable and ready for rollout evidence.',
      '',
    ];
  }

  return [
    '## Next Actions',
    '',
    '- Regenerate package smoke summaries and rerun this report.',
    '- Ensure block/minimal CI evidence files exist and follow v2.1 schema.',
    '',
  ];
};
