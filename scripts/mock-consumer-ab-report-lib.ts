import {
  DEFAULT_MOCK_CONSUMER_AB_BLOCK_EVIDENCE_FILE,
  DEFAULT_MOCK_CONSUMER_AB_BLOCK_SUMMARY,
  DEFAULT_MOCK_CONSUMER_AB_MINIMAL_EVIDENCE_FILE,
  DEFAULT_MOCK_CONSUMER_AB_MINIMAL_SUMMARY,
  DEFAULT_MOCK_CONSUMER_AB_OUT_FILE,
  DEFAULT_MOCK_CONSUMER_AB_REPO,
  type MockConsumerAbCliOptions,
} from './mock-consumer-ab-contract';
export {
  DEFAULT_MOCK_CONSUMER_AB_BLOCK_EVIDENCE_FILE,
  DEFAULT_MOCK_CONSUMER_AB_BLOCK_SUMMARY,
  DEFAULT_MOCK_CONSUMER_AB_MINIMAL_EVIDENCE_FILE,
  DEFAULT_MOCK_CONSUMER_AB_MINIMAL_SUMMARY,
  DEFAULT_MOCK_CONSUMER_AB_OUT_FILE,
  DEFAULT_MOCK_CONSUMER_AB_REPO,
  type EvidenceAssessment,
  type MockConsumerAbCliOptions,
} from './mock-consumer-ab-contract';
export { assessEvidenceFile, isEvidenceHealthy } from './mock-consumer-ab-evidence-lib';
export { buildMockConsumerAbMarkdown } from './mock-consumer-ab-markdown-lib';

export const parseMockConsumerAbArgs = (
  args: ReadonlyArray<string>
): MockConsumerAbCliOptions => {
  const options: MockConsumerAbCliOptions = {
    repo: DEFAULT_MOCK_CONSUMER_AB_REPO,
    outFile: DEFAULT_MOCK_CONSUMER_AB_OUT_FILE,
    blockSummaryFile: DEFAULT_MOCK_CONSUMER_AB_BLOCK_SUMMARY,
    minimalSummaryFile: DEFAULT_MOCK_CONSUMER_AB_MINIMAL_SUMMARY,
    blockEvidenceFile: DEFAULT_MOCK_CONSUMER_AB_BLOCK_EVIDENCE_FILE,
    minimalEvidenceFile: DEFAULT_MOCK_CONSUMER_AB_MINIMAL_EVIDENCE_FILE,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }
    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }
    if (arg === '--block-summary') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --block-summary');
      }
      options.blockSummaryFile = value;
      index += 1;
      continue;
    }
    if (arg === '--minimal-summary') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --minimal-summary');
      }
      options.minimalSummaryFile = value;
      index += 1;
      continue;
    }
    if (arg === '--block-evidence') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --block-evidence');
      }
      options.blockEvidenceFile = value;
      index += 1;
      continue;
    }
    if (arg === '--minimal-evidence') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --minimal-evidence');
      }
      options.minimalEvidenceFile = value;
      index += 1;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};
