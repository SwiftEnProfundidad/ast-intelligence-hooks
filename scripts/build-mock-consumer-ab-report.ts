import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { assessSmokeSummary, isExpectedModeResult } from './mock-consumer-smoke-lib';

type CliOptions = {
  repo: string;
  outFile: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  evidenceFile: string;
  dryRun: boolean;
};

type EvidenceAssessment = {
  file: string;
  exists: boolean;
  parseError?: string;
  version?: string;
  stage?: string;
  outcome?: string;
};

const DEFAULT_REPO = 'owner/repo';
const DEFAULT_OUT_FILE = '.audit-reports/mock-consumer/mock-consumer-ab-report.md';
const DEFAULT_BLOCK_SUMMARY = '.audit-reports/package-smoke/block/summary.md';
const DEFAULT_MINIMAL_SUMMARY = '.audit-reports/package-smoke/minimal/summary.md';
const DEFAULT_EVIDENCE_FILE = '.ai_evidence.json';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repo: DEFAULT_REPO,
    outFile: DEFAULT_OUT_FILE,
    blockSummaryFile: DEFAULT_BLOCK_SUMMARY,
    minimalSummaryFile: DEFAULT_MINIMAL_SUMMARY,
    evidenceFile: DEFAULT_EVIDENCE_FILE,
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
    if (arg === '--evidence') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --evidence');
      }
      options.evidenceFile = value;
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

const assessEvidence = (pathLike: string): EvidenceAssessment => {
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

const isEvidenceHealthy = (assessment: EvidenceAssessment): boolean =>
  assessment.exists &&
  !assessment.parseError &&
  assessment.version === '2.1' &&
  typeof assessment.stage === 'string' &&
  assessment.stage.length > 0 &&
  typeof assessment.outcome === 'string' &&
  assessment.outcome.length > 0;

const buildMarkdown = (params: {
  generatedAt: string;
  repo: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  evidenceFile: string;
  blockReady: boolean;
  minimalReady: boolean;
  evidence: EvidenceAssessment;
}): { markdown: string; verdict: 'READY' | 'BLOCKED'; blockers: ReadonlyArray<string> } => {
  const blockers: string[] = [];

  if (!params.blockReady) {
    blockers.push('Package smoke block mode summary is not in expected blocking state');
  }
  if (!params.minimalReady) {
    blockers.push('Package smoke minimal mode summary is not in expected pass state');
  }
  if (!isEvidenceHealthy(params.evidence)) {
    if (!params.evidence.exists) {
      blockers.push('ai_evidence file is missing');
    } else if (params.evidence.parseError) {
      blockers.push('ai_evidence file is not valid JSON');
    } else {
      blockers.push('ai_evidence does not expose expected v2.1 snapshot metadata');
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
  lines.push(`- evidence: \`${params.evidenceFile}\``);
  lines.push('');
  lines.push('## Assertions');
  lines.push('');
  lines.push(`- smoke_block_expected: ${params.blockReady ? 'PASS' : 'FAIL'}`);
  lines.push(`- smoke_minimal_expected: ${params.minimalReady ? 'PASS' : 'FAIL'}`);
  lines.push(`- evidence_schema_v2_1: ${isEvidenceHealthy(params.evidence) ? 'PASS' : 'FAIL'}`);
  lines.push(`- evidence_version: ${params.evidence.version ?? 'missing'}`);
  lines.push(`- evidence_snapshot_stage: ${params.evidence.stage ?? 'missing'}`);
  lines.push(`- evidence_snapshot_outcome: ${params.evidence.outcome ?? 'missing'}`);
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
    lines.push('- Ensure `.ai_evidence.json` exists and follows v2.1 schema.');
  }
  lines.push('');

  return {
    markdown: `${lines.join('\n')}\n`,
    verdict,
    blockers,
  };
};

const main = (): number => {
  try {
    const options = parseArgs(process.argv.slice(2));
    const generatedAt = new Date().toISOString();

    const blockAssessment = assessSmokeSummary('block', options.blockSummaryFile);
    const minimalAssessment = assessSmokeSummary('minimal', options.minimalSummaryFile);
    const evidenceAssessment = assessEvidence(options.evidenceFile);

    const blockReady = isExpectedModeResult(blockAssessment);
    const minimalReady = isExpectedModeResult(minimalAssessment);

    const report = buildMarkdown({
      generatedAt,
      repo: options.repo,
      blockSummaryFile: options.blockSummaryFile,
      minimalSummaryFile: options.minimalSummaryFile,
      evidenceFile: options.evidenceFile,
      blockReady,
      minimalReady,
      evidence: evidenceAssessment,
    });

    const outPath = resolve(process.cwd(), options.outFile);

    if (!options.dryRun) {
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, report.markdown, 'utf8');
    }

    const mode = options.dryRun ? 'dry-run' : 'write';
    console.log(
      `[build-mock-consumer-ab-report] ${mode} verdict=${report.verdict} out=${options.outFile}`
    );

    return report.verdict === 'READY' ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[build-mock-consumer-ab-report] error: ${message}`);
    return 1;
  }
};

process.exit(main());
