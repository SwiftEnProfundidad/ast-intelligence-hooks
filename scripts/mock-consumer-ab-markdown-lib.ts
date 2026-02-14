import { buildMockConsumerAbBlockers } from './mock-consumer-ab-blockers-lib';
import type {
  MockConsumerAbMarkdownParams,
  MockConsumerAbVerdict,
} from './mock-consumer-ab-markdown-contract';
import { buildMockConsumerAbMarkdownLines } from './mock-consumer-ab-markdown-sections-lib';

export const buildMockConsumerAbMarkdown = (
  params: MockConsumerAbMarkdownParams
): { markdown: string; verdict: MockConsumerAbVerdict; blockers: ReadonlyArray<string> } => {
  const blockers = buildMockConsumerAbBlockers(params);
  const verdict: MockConsumerAbVerdict = blockers.length === 0 ? 'READY' : 'BLOCKED';
  const lines = buildMockConsumerAbMarkdownLines({
    source: params,
    verdict,
    blockers,
  });

  return {
    markdown: `${lines.join('\n')}\n`,
    verdict,
    blockers,
  };
};
