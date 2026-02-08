import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildConsumerStartupTriageCommands,
  buildConsumerStartupTriageReportMarkdown,
  resolveConsumerStartupTriageOutputs,
  type ConsumerStartupTriageExecution,
} from './consumer-startup-triage-lib';

type CliOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
  dryRun: boolean;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_OUT_DIR = 'docs/validation';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repo: '',
    limit: DEFAULT_LIMIT,
    outDir: DEFAULT_OUT_DIR,
    runWorkflowLint: true,
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

    if (arg === '--out-dir') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out-dir');
      }
      options.outDir = value;
      index += 1;
      continue;
    }

    if (arg === '--repo-path') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo-path');
      }
      options.repoPath = value;
      index += 1;
      continue;
    }

    if (arg === '--actionlint-bin') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --actionlint-bin');
      }
      options.actionlintBin = value;
      index += 1;
      continue;
    }

    if (arg === '--skip-workflow-lint') {
      options.runWorkflowLint = false;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repo) {
    throw new Error('Missing required argument --repo <owner/repo>');
  }

  return options;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));

  const commands = buildConsumerStartupTriageCommands({
    repo: options.repo,
    limit: options.limit,
    outDir: options.outDir,
    runWorkflowLint: options.runWorkflowLint,
    repoPath: options.repoPath,
    actionlintBin: options.actionlintBin,
  });

  if (options.dryRun) {
    process.stdout.write('consumer startup triage dry-run plan:\n');
    for (const command of commands) {
      process.stdout.write(
        `- ${command.id}: npx --yes tsx@4.21.0 ${command.script} ${command.args.join(' ')}\n`
      );
    }
    return 0;
  }

  const executions: ConsumerStartupTriageExecution[] = [];

  for (const command of commands) {
    const scriptPath = resolve(process.cwd(), command.script);

    try {
      execFileSync('npx', ['--yes', 'tsx@4.21.0', scriptPath, ...command.args], {
        stdio: 'inherit',
      });
      executions.push({
        command,
        exitCode: 0,
        ok: true,
      });
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? Number((error as { status?: number }).status ?? 1)
          : 1;
      executions.push({
        command,
        exitCode: Number.isFinite(status) ? status : 1,
        ok: false,
        error: error instanceof Error ? error.message : 'unknown command failure',
      });
    }
  }

  const outputs = resolveConsumerStartupTriageOutputs(options.outDir);
  const report = buildConsumerStartupTriageReportMarkdown({
    generatedAt: new Date().toISOString(),
    repo: options.repo,
    outDir: options.outDir,
    commands,
    executions,
  });

  const reportPath = resolve(process.cwd(), outputs.triageReport);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report, 'utf8');

  process.stdout.write(`consumer startup triage report generated at ${reportPath}\n`);

  const requiredFailures = executions.filter(
    (execution) => execution.command.required && !execution.ok
  );

  return requiredFailures.length === 0 ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`consumer startup triage failed: ${message}\n`);
  process.exit(1);
}
