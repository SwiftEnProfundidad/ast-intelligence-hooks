import { buildMockConsumerAbAssertionsLines } from './mock-consumer-ab-markdown-assertions-lib';
import { buildMockConsumerAbBlockersLines } from './mock-consumer-ab-markdown-blockers-lib';
import type {
  MockConsumerAbMarkdownParams,
  MockConsumerAbVerdict,
} from './mock-consumer-ab-markdown-contract';
import { buildMockConsumerAbHeaderAndInputs } from './mock-consumer-ab-markdown-header-inputs-lib';
import { buildMockConsumerAbNextActionsLines } from './mock-consumer-ab-markdown-next-actions-lib';

export const buildMockConsumerAbMarkdownLines = (params: {
  source: MockConsumerAbMarkdownParams;
  verdict: MockConsumerAbVerdict;
  blockers: ReadonlyArray<string>;
}): ReadonlyArray<string> => {
  return [
    ...buildMockConsumerAbHeaderAndInputs(params.source, params.verdict),
    ...buildMockConsumerAbAssertionsLines(params.source),
    ...buildMockConsumerAbBlockersLines(params.blockers),
    ...buildMockConsumerAbNextActionsLines(params.verdict),
  ];
};
