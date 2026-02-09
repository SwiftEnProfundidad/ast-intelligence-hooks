import { isEvidenceHealthy } from './mock-consumer-ab-evidence-lib';
import type {
  MockConsumerAbMarkdownParams,
  MockConsumerAbVerdict,
} from './mock-consumer-ab-markdown-contract';

const appendBlockersList = (params: {
  lines: string[];
  blockers: ReadonlyArray<string>;
}): void => {
  if (params.blockers.length === 0) {
    params.lines.push('- none');
    return;
  }

  for (const blocker of params.blockers) {
    params.lines.push(`- ${blocker}`);
  }
};

export const buildMockConsumerAbMarkdownLines = (params: {
  source: MockConsumerAbMarkdownParams;
  verdict: MockConsumerAbVerdict;
  blockers: ReadonlyArray<string>;
}): ReadonlyArray<string> => {
  const lines: string[] = [];

  lines.push('# Mock Consumer A/B Validation Report');
  lines.push('');
  lines.push(`- generated_at: ${params.source.generatedAt}`);
  lines.push(`- target_repo: \`${params.source.repo}\``);
  lines.push('- source: local_mock_consumer_validation');
  lines.push(`- verdict: ${params.verdict}`);
  lines.push('');
  lines.push('## Inputs');
  lines.push('');
  lines.push(`- block_summary: \`${params.source.blockSummaryFile}\``);
  lines.push(`- minimal_summary: \`${params.source.minimalSummaryFile}\``);
  lines.push(`- block_evidence: \`${params.source.blockEvidenceFile}\``);
  lines.push(`- minimal_evidence: \`${params.source.minimalEvidenceFile}\``);
  lines.push('');
  lines.push('## Assertions');
  lines.push('');
  lines.push(`- smoke_block_expected: ${params.source.blockReady ? 'PASS' : 'FAIL'}`);
  lines.push(`- smoke_minimal_expected: ${params.source.minimalReady ? 'PASS' : 'FAIL'}`);
  lines.push(
    `- block_evidence_schema_v2_1: ${isEvidenceHealthy(params.source.blockEvidence, 'BLOCK') ? 'PASS' : 'FAIL'}`
  );
  lines.push(
    `- minimal_evidence_schema_v2_1: ${isEvidenceHealthy(params.source.minimalEvidence, 'PASS') ? 'PASS' : 'FAIL'}`
  );
  lines.push(`- block_evidence_version: ${params.source.blockEvidence.version ?? 'missing'}`);
  lines.push(`- block_evidence_snapshot_stage: ${params.source.blockEvidence.stage ?? 'missing'}`);
  lines.push(
    `- block_evidence_snapshot_outcome: ${params.source.blockEvidence.outcome ?? 'missing'}`
  );
  lines.push(`- minimal_evidence_version: ${params.source.minimalEvidence.version ?? 'missing'}`);
  lines.push(
    `- minimal_evidence_snapshot_stage: ${params.source.minimalEvidence.stage ?? 'missing'}`
  );
  lines.push(
    `- minimal_evidence_snapshot_outcome: ${params.source.minimalEvidence.outcome ?? 'missing'}`
  );
  lines.push('');
  lines.push('## Blockers');
  lines.push('');
  appendBlockersList({
    lines,
    blockers: params.blockers,
  });
  lines.push('');
  lines.push('## Next Actions');
  lines.push('');
  if (params.verdict === 'READY') {
    lines.push('- Mock consumer A/B validation is stable and ready for rollout evidence.');
  } else {
    lines.push('- Regenerate package smoke summaries and rerun this report.');
    lines.push('- Ensure block/minimal CI evidence files exist and follow v2.1 schema.');
  }
  lines.push('');

  return lines;
};
