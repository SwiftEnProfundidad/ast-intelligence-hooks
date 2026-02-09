import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type MockConsumerAbCliOptions = {
  repo: string;
  outFile: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
  dryRun: boolean;
};

export type EvidenceAssessment = {
  file: string;
  exists: boolean;
  parseError?: string;
  version?: string;
  stage?: string;
  outcome?: string;
};

export const DEFAULT_MOCK_CONSUMER_AB_REPO = 'owner/repo';
export const DEFAULT_MOCK_CONSUMER_AB_OUT_FILE =
  '.audit-reports/mock-consumer/mock-consumer-ab-report.md';
export const DEFAULT_MOCK_CONSUMER_AB_BLOCK_SUMMARY =
  '.audit-reports/package-smoke/block/summary.md';
export const DEFAULT_MOCK_CONSUMER_AB_MINIMAL_SUMMARY =
  '.audit-reports/package-smoke/minimal/summary.md';
export const DEFAULT_MOCK_CONSUMER_AB_BLOCK_EVIDENCE_FILE =
  '.audit-reports/package-smoke/block/ci.ai_evidence.json';
export const DEFAULT_MOCK_CONSUMER_AB_MINIMAL_EVIDENCE_FILE =
  '.audit-reports/package-smoke/minimal/ci.ai_evidence.json';

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

export const assessEvidenceFile = (pathLike: string): EvidenceAssessment => {
  const absolute = resolve(process.cwd(), pathLike);

  if (!existsSync(absolute)) {
    return {
      file: pathLike,
      exists: false,
    };
  }

  try {
    const raw = readFileSync(absolute, 'utf8');
    const parsed = JSON.parse(raw) as {
      version?: string;
      snapshot?: {
        stage?: string;
        outcome?: string;
      };
    };

    return {
      file: pathLike,
      exists: true,
      version: typeof parsed.version === 'string' ? parsed.version : undefined,
      stage: typeof parsed.snapshot?.stage === 'string' ? parsed.snapshot.stage : undefined,
      outcome:
        typeof parsed.snapshot?.outcome === 'string' ? parsed.snapshot.outcome : undefined,
    };
  } catch (error) {
    return {
      file: pathLike,
      exists: true,
      parseError: error instanceof Error ? error.message : 'invalid json',
    };
  }
};

export const isEvidenceHealthy = (
  assessment: EvidenceAssessment,
  expectedOutcome: 'PASS' | 'BLOCK'
): boolean =>
  assessment.exists &&
  !assessment.parseError &&
  assessment.version === '2.1' &&
  assessment.stage === 'CI' &&
  assessment.outcome === expectedOutcome;

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
