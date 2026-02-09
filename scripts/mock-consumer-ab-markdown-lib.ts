import type { EvidenceAssessment } from './mock-consumer-ab-contract';
import { isEvidenceHealthy } from './mock-consumer-ab-evidence-lib';

export const buildMockConsumerAbMarkdown = (params: {
  generatedAt: string;
  repo: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
  blockReady: boolean;
  minimalReady: boolean;
  blockEvidence: EvidenceAssessment;
  minimalEvidence: EvidenceAssessment;
}): { markdown: string; verdict: 'READY' | 'BLOCKED'; blockers: ReadonlyArray<string> } => {
  const blockers: string[] = [];

  if (!params.blockReady) {
    blockers.push('Package smoke block mode summary is not in expected blocking state');
  }
  if (!params.minimalReady) {
    blockers.push('Package smoke minimal mode summary is not in expected pass state');
  }
  if (!isEvidenceHealthy(params.blockEvidence, 'BLOCK')) {
    if (!params.blockEvidence.exists) {
      blockers.push('block evidence file is missing');
    } else if (params.blockEvidence.parseError) {
      blockers.push('block evidence file is not valid JSON');
    } else {
      blockers.push('block evidence does not expose expected v2.1 CI BLOCK snapshot');
    }
  }

  if (!isEvidenceHealthy(params.minimalEvidence, 'PASS')) {
    if (!params.minimalEvidence.exists) {
      blockers.push('minimal evidence file is missing');
    } else if (params.minimalEvidence.parseError) {
      blockers.push('minimal evidence file is not valid JSON');
    } else {
      blockers.push('minimal evidence does not expose expected v2.1 CI PASS snapshot');
    }
  }

  const verdict: 'READY' | 'BLOCKED' = blockers.length === 0 ? 'READY' : 'BLOCKED';

  const lines: string[] = [];
  lines.push('# Mock Consumer A/B Validation Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push('- source: local_mock_consumer_validation');
  lines.push(`- verdict: ${verdict}`);
  lines.push('');
  lines.push('## Inputs');
  lines.push('');
  lines.push(`- block_summary: \`${params.blockSummaryFile}\``);
  lines.push(`- minimal_summary: \`${params.minimalSummaryFile}\``);
  lines.push(`- block_evidence: \`${params.blockEvidenceFile}\``);
  lines.push(`- minimal_evidence: \`${params.minimalEvidenceFile}\``);
  lines.push('');
  lines.push('## Assertions');
  lines.push('');
  lines.push(`- smoke_block_expected: ${params.blockReady ? 'PASS' : 'FAIL'}`);
  lines.push(`- smoke_minimal_expected: ${params.minimalReady ? 'PASS' : 'FAIL'}`);
  lines.push(
    `- block_evidence_schema_v2_1: ${isEvidenceHealthy(params.blockEvidence, 'BLOCK') ? 'PASS' : 'FAIL'}`
  );
  lines.push(
    `- minimal_evidence_schema_v2_1: ${isEvidenceHealthy(params.minimalEvidence, 'PASS') ? 'PASS' : 'FAIL'}`
  );
  lines.push(`- block_evidence_version: ${params.blockEvidence.version ?? 'missing'}`);
  lines.push(`- block_evidence_snapshot_stage: ${params.blockEvidence.stage ?? 'missing'}`);
  lines.push(
    `- block_evidence_snapshot_outcome: ${params.blockEvidence.outcome ?? 'missing'}`
  );
  lines.push(`- minimal_evidence_version: ${params.minimalEvidence.version ?? 'missing'}`);
  lines.push(
    `- minimal_evidence_snapshot_stage: ${params.minimalEvidence.stage ?? 'missing'}`
  );
  lines.push(
    `- minimal_evidence_snapshot_outcome: ${params.minimalEvidence.outcome ?? 'missing'}`
  );
  lines.push('');
  lines.push('## Blockers');
  lines.push('');
  if (blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of blockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');
  lines.push('## Next Actions');
  lines.push('');
  if (verdict === 'READY') {
    lines.push('- Mock consumer A/B validation is stable and ready for rollout evidence.');
  } else {
    lines.push('- Regenerate package smoke summaries and rerun this report.');
    lines.push('- Ensure block/minimal CI evidence files exist and follow v2.1 schema.');
  }
  lines.push('');

  return {
    markdown: `${lines.join('\n')}\n`,
    verdict,
    blockers,
  };
};
