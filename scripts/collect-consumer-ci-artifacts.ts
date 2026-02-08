import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type CliOptions = {
  repo: string;
  limit: number;
  outFile: string;
};

type WorkflowRun = {
  databaseId: number;
  displayTitle: string;
  workflowName: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
  event: string;
  headBranch: string;
  headSha: string;
};

type RunMetadata = {
  id: number;
  name: string;
  path: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  referenced_workflows: ReadonlyArray<unknown>;
};

type Artifact = {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  expired: boolean;
  expires_at: string;
};

type ArtifactResponse = {
  total_count: number;
  artifacts: Artifact[];
};

const DEFAULT_LIMIT = 20;
const DEFAULT_OUT_FILE = 'docs/validation/consumer-ci-artifacts-report.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repo: '',
    limit: DEFAULT_LIMIT,
    outFile: DEFAULT_OUT_FILE,
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

    if (arg === '--limit') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --limit');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --limit value: ${value}`);
      }
      options.limit = parsed;
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

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repo) {
    throw new Error('Missing required argument --repo <owner/repo>');
  }

  return options;
};

const runGh = (args: ReadonlyArray<string>): string => {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

const runGhJson = <T>(args: ReadonlyArray<string>): T => {
  const output = runGh(args);
  return JSON.parse(output) as T;
};

const toMegabytes = (bytes: number): string => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

const collect = (options: CliOptions): string => {
  runGh(['auth', 'status']);

  const runs = runGhJson<WorkflowRun[]>([
    'run',
    'list',
    '--repo',
    options.repo,
    '--limit',
    String(options.limit),
    '--json',
    [
      'databaseId',
      'displayTitle',
      'workflowName',
      'status',
      'conclusion',
      'url',
      'createdAt',
      'event',
      'headBranch',
      'headSha',
    ].join(','),
  ]);

  const now = new Date().toISOString();
  const lines: string[] = [];
  lines.push('# Consumer CI Artifact Report');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- repo: \`${options.repo}\``);
  lines.push(`- runs_checked: ${runs.length}`);
  lines.push('');

  const startupFailures = runs.filter((run) => run.conclusion === 'startup_failure');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- startup_failure_runs: ${startupFailures.length}`);
  lines.push(`- non_startup_failure_runs: ${runs.length - startupFailures.length}`);
  lines.push('');

  lines.push('## Runs');
  lines.push('');
  lines.push(
    '| run_id | workflow | event | branch | status | conclusion | artifacts | url |'
  );
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const run of runs) {
    let metadata: RunMetadata | undefined;
    let artifacts: ArtifactResponse | undefined;
    let errorLabel = '';

    try {
      metadata = runGhJson<RunMetadata>([
        'api',
        `repos/${options.repo}/actions/runs/${run.databaseId}`,
      ]);
      artifacts = runGhJson<ArtifactResponse>([
        'api',
        `repos/${options.repo}/actions/runs/${run.databaseId}/artifacts`,
      ]);
    } catch (error) {
      errorLabel =
        error instanceof Error
          ? error.message.replace(/\s+/g, ' ').trim()
          : 'failed to fetch run metadata';
    }

    const workflowName =
      run.workflowName || metadata?.name || metadata?.path || '(unknown)';
    const artifactsCount = artifacts?.total_count ?? 0;
    const artifactsCell = errorLabel
      ? `error: ${errorLabel}`
      : String(artifactsCount);

    lines.push(
      `| ${run.databaseId} | ${workflowName} | ${run.event} | ${run.headBranch} | ${run.status} | ${run.conclusion ?? 'null'} | ${artifactsCell} | ${run.url} |`
    );

    if (artifacts && artifacts.artifacts.length > 0) {
      for (const artifact of artifacts.artifacts) {
        lines.push(
          `  - artifact \`${artifact.name}\` id=${artifact.id} size_mb=${toMegabytes(artifact.size_in_bytes)} expired=${artifact.expired} expires_at=${artifact.expires_at}`
        );
        lines.push(`    - download_url: ${artifact.archive_download_url}`);
      }
    } else if (metadata?.conclusion === 'startup_failure') {
      lines.push(
        `  - startup_failure details: path=\`${metadata.path}\` referenced_workflows=${metadata.referenced_workflows.length}`
      );
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));
  const report = collect(options);
  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, report, 'utf8');
  process.stdout.write(`consumer CI artifact report generated at ${outputPath}\n`);
  return 0;
};

process.exitCode = main();
