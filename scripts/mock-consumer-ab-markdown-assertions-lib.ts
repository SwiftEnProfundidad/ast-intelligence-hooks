import { isEvidenceHealthy } from './mock-consumer-ab-evidence-lib';
import type { MockConsumerAbMarkdownParams } from './mock-consumer-ab-markdown-contract';

export const buildMockConsumerAbAssertionsLines = (
  source: MockConsumerAbMarkdownParams
): ReadonlyArray<string> => [
  '## Assertions',
  '',
  `- smoke_block_expected: ${source.blockReady ? 'PASS' : 'FAIL'}`,
  `- smoke_minimal_expected: ${source.minimalReady ? 'PASS' : 'FAIL'}`,
  `- block_evidence_schema_v2_1: ${
    isEvidenceHealthy(source.blockEvidence, 'BLOCK') ? 'PASS' : 'FAIL'
  }`,
  `- minimal_evidence_schema_v2_1: ${
    isEvidenceHealthy(source.minimalEvidence, 'PASS') ? 'PASS' : 'FAIL'
  }`,
  `- block_evidence_version: ${source.blockEvidence.version ?? 'missing'}`,
  `- block_evidence_snapshot_stage: ${source.blockEvidence.stage ?? 'missing'}`,
  `- block_evidence_snapshot_outcome: ${source.blockEvidence.outcome ?? 'missing'}`,
  `- minimal_evidence_version: ${source.minimalEvidence.version ?? 'missing'}`,
  `- minimal_evidence_snapshot_stage: ${source.minimalEvidence.stage ?? 'missing'}`,
  `- minimal_evidence_snapshot_outcome: ${source.minimalEvidence.outcome ?? 'missing'}`,
  '',
];
