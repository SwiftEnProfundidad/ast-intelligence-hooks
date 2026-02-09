import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { resolveConsumerStartupTriageOutputs } from './consumer-startup-triage-lib';

type CliOptions = {
  repo: string;
  outDir: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  dryRun: boolean;
};

type SmokeMode = 'block' | 'minimal';

type SmokeAssessment = {
  mode: SmokeMode;
  file: string;
  exists: boolean;
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  preCommitExit?: number;
  prePushExit?: number;
  ciExit?: number;
  preCommitOutcome?: string;
  prePushOutcome?: string;
  ciOutcome?: string;
};

const DEFAULT_REPO = 'owner/repo';
const DEFAULT_OUT_DIR = '.audit-reports/phase5';
const DEFAULT_BLOCK_SUMMARY = '.audit-reports/package-smoke/block/summary.md';
const DEFAULT_MINIMAL_SUMMARY = '.audit-reports/package-smoke/minimal/summary.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repo: DEFAULT_REPO,
    outDir: DEFAULT_OUT_DIR,
    blockSummaryFile: DEFAULT_BLOCK_SUMMARY,
    minimalSummaryFile: DEFAULT_MINIMAL_SUMMARY,
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
    if (arg === '--out-dir') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out-dir');
      }
      options.outDir = value;
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
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const parseExitLine = (
  markdown: string,
  label: 'pre-commit' | 'pre-push' | 'ci'
): { exit?: number; outcome?: string } => {
  const regex = new RegExp(`- ${label} exit:\\s*\\\`?(\\d+)\\\`?\\s*\\(([^)]+)\\)`, 'i');
  const match = markdown.match(regex);
  if (!match) {
    return {};
  }
  return {
    exit: Number.parseInt(match[1] ?? '', 10),
    outcome: (match[2] ?? '').trim().toUpperCase(),
  };
};

const assessSummary = (mode: SmokeMode, pathLike: string): SmokeAssessment => {
  const absolute = resolve(process.cwd(), pathLike);
  if (!existsSync(absolute)) {
    return {
      mode,
      file: pathLike,
      exists: false,
      status: 'UNKNOWN',
    };
  }

  const markdown = readFileSync(absolute, 'utf8');
  const statusRaw = markdown.match(/- Status:\s*([A-Z]+)/i)?.[1]?.trim().toUpperCase();
  const status =
    statusRaw === 'PASS' || statusRaw === 'FAIL'
      ? (statusRaw as 'PASS' | 'FAIL')
      : 'UNKNOWN';

  const preCommit = parseExitLine(markdown, 'pre-commit');
  const prePush = parseExitLine(markdown, 'pre-push');
  const ci = parseExitLine(markdown, 'ci');

  return {
    mode,
    file: pathLike,
    exists: true,
    status,
    preCommitExit: preCommit.exit,
    prePushExit: prePush.exit,
    ciExit: ci.exit,
    preCommitOutcome: preCommit.outcome,
    prePushOutcome: prePush.outcome,
    ciOutcome: ci.outcome,
  };
};

const isExpectedModeResult = (assessment: SmokeAssessment): boolean => {
  if (!assessment.exists || assessment.status !== 'PASS') {
    return false;
  }

  if (assessment.mode === 'block') {
    return (
      assessment.preCommitExit === 1 &&
      assessment.prePushExit === 1 &&
      assessment.ciExit === 1 &&
      assessment.preCommitOutcome === 'BLOCK' &&
      assessment.prePushOutcome === 'BLOCK' &&
      assessment.ciOutcome === 'BLOCK'
    );
  }

  return (
    assessment.preCommitExit === 0 &&
    assessment.prePushExit === 0 &&
    assessment.ciExit === 0 &&
    assessment.preCommitOutcome === 'PASS' &&
    assessment.prePushOutcome === 'PASS' &&
    assessment.ciOutcome === 'PASS'
  );
};

const buildTriageMarkdown = (params: {
  generatedAt: string;
  repo: string;
  outDir: string;
  assessments: ReadonlyArray<SmokeAssessment>;
}): { markdown: string; verdict: 'READY' | 'BLOCKED'; failedSteps: string[] } => {
  const failedSteps = params.assessments
    .filter((assessment) => !isExpectedModeResult(assessment))
    .map((assessment) => `mock-package-smoke-${assessment.mode}`);

  const verdict: 'READY' | 'BLOCKED' = failedSteps.length === 0 ? 'READY' : 'BLOCKED';
  const lines: string[] = [];

  lines.push('# Consumer Startup Triage Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- output_directory: \`${params.outDir}\``);
  lines.push('- source: mock_consumer_package_smoke');
  lines.push(`- verdict: ${verdict}`);
  lines.push('');

  lines.push('## Executions');
  lines.push('');
  lines.push('| id | required | status | output |');
  lines.push('| --- | --- | --- | --- |');
  for (const assessment of params.assessments) {
    const id = `mock-package-smoke-${assessment.mode}`;
    const ok = isExpectedModeResult(assessment);
    lines.push(
      `| ${id} | yes | ${ok ? 'ok' : 'failed'} | \`${assessment.file}\` |`
    );
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (verdict === 'READY') {
    lines.push('- Triage outputs are ready for review and escalation workflow.');
  } else {
    for (const failedStep of failedSteps) {
      lines.push(`- Resolve failed required step \`${failedStep}\` and rerun startup triage.`);
    }
  }
  lines.push('');

  return {
    markdown: `${lines.join('\n')}\n`,
    verdict,
    failedSteps,
  };
};

const buildUnblockMarkdown = (params: {
  generatedAt: string;
  repo: string;
  triageReportPath: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  triageVerdict: 'READY' | 'BLOCKED';
}): { markdown: string; verdict: 'READY_FOR_RETEST' | 'BLOCKED' } => {
  const verdict: 'READY_FOR_RETEST' | 'BLOCKED' =
    params.triageVerdict === 'READY' ? 'READY_FOR_RETEST' : 'BLOCKED';

  const lines: string[] = [];
  lines.push('# Consumer Startup Unblock Status');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- verdict: ${verdict}`);
  lines.push('');
  lines.push('## Inputs');
  lines.push('');
  lines.push(`- triage_report: \`${params.triageReportPath}\``);
  lines.push(`- smoke_block_summary: \`${params.blockSummaryFile}\``);
  lines.push(`- smoke_minimal_summary: \`${params.minimalSummaryFile}\``);
  lines.push('');
  lines.push('## Next Actions');
  lines.push('');
  if (verdict === 'READY_FOR_RETEST') {
    lines.push('- Startup unblock criteria are clear for retest in approved consumer context.');
  } else {
    lines.push('- Resolve mock package smoke failures and regenerate startup triage outputs.');
  }
  lines.push('');

  return {
    markdown: `${lines.join('\n')}\n`,
    verdict,
  };
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));
  const outputs = resolveConsumerStartupTriageOutputs(options.outDir);

  if (options.dryRun) {
    process.stdout.write('mock consumer startup triage dry-run plan:\n');
    process.stdout.write(`- block-summary: ${options.blockSummaryFile}\n`);
    process.stdout.write(`- minimal-summary: ${options.minimalSummaryFile}\n`);
    process.stdout.write(`- triage-report: ${outputs.triageReport}\n`);
    process.stdout.write(`- unblock-report: ${outputs.startupUnblockStatus}\n`);
    return 0;
  }

  const assessments: SmokeAssessment[] = [
    assessSummary('block', options.blockSummaryFile),
    assessSummary('minimal', options.minimalSummaryFile),
  ];

  const generatedAt = new Date().toISOString();
  const triage = buildTriageMarkdown({
    generatedAt,
    repo: options.repo,
    outDir: options.outDir,
    assessments,
  });
  const unblock = buildUnblockMarkdown({
    generatedAt,
    repo: options.repo,
    triageReportPath: outputs.triageReport,
    blockSummaryFile: options.blockSummaryFile,
    minimalSummaryFile: options.minimalSummaryFile,
    triageVerdict: triage.verdict,
  });

  const triagePath = resolve(process.cwd(), outputs.triageReport);
  const unblockPath = resolve(process.cwd(), outputs.startupUnblockStatus);
  mkdirSync(dirname(triagePath), { recursive: true });
  mkdirSync(dirname(unblockPath), { recursive: true });
  writeFileSync(triagePath, triage.markdown, 'utf8');
  writeFileSync(unblockPath, unblock.markdown, 'utf8');

  process.stdout.write(
    `mock consumer startup triage generated at ${triagePath} (verdict=${triage.verdict})\n`
  );
  process.stdout.write(
    `mock consumer startup unblock status generated at ${unblockPath} (verdict=${unblock.verdict})\n`
  );

  return triage.verdict === 'READY' ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`mock consumer startup triage failed: ${message}\n`);
  process.exit(1);
}
