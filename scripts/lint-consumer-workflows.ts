import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type CliOptions = {
  repoPath: string;
  outFile: string;
  actionlintBin: string;
};

const DEFAULT_OUT_FILE = 'docs/validation/consumer-workflow-lint-report.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repoPath: '',
    outFile: DEFAULT_OUT_FILE,
    actionlintBin: 'actionlint',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo-path') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo-path');
      }
      options.repoPath = value;
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

    if (arg === '--actionlint-bin') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --actionlint-bin');
      }
      options.actionlintBin = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repoPath) {
    throw new Error('Missing required argument --repo-path <path>');
  }

  return options;
};

const runActionlint = (options: CliOptions): {
  exitCode: number;
  output: string;
  workflowPath: string;
} => {
  const workflowsDir = resolve(options.repoPath, '.github/workflows');
  const workflowFiles = readdirSync(workflowsDir)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => resolve(workflowsDir, name))
    .sort();

  if (workflowFiles.length === 0) {
    return {
      exitCode: 0,
      output: 'No workflow files found under .github/workflows',
      workflowPath: `${workflowsDir}/*.{yml,yaml}`,
    };
  }

  try {
    const output = execFileSync(options.actionlintBin, [
      '-color',
      '-shellcheck=',
      '-pyflakes=',
      ...workflowFiles,
    ], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      exitCode: 0,
      output,
      workflowPath: `${workflowsDir}/*.{yml,yaml}`,
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'stdout' in error &&
      'stderr' in error
    ) {
      const status = Number((error as { status?: number }).status ?? 1);
      const stdout = String((error as { stdout?: string | Buffer }).stdout ?? '');
      const stderr = String((error as { stderr?: string | Buffer }).stderr ?? '');
      return {
        exitCode: Number.isFinite(status) ? status : 1,
        output: `${stdout}${stderr}`.trim(),
        workflowPath: `${workflowsDir}/*.{yml,yaml}`,
      };
    }
    throw error;
  }
};

const buildMarkdown = (params: {
  options: CliOptions;
  lintResult: ReturnType<typeof runActionlint>;
}): string => {
  const now = new Date().toISOString();
  const lines: string[] = [];
  lines.push('# Consumer Workflow Lint Report');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- repo_path: \`${resolve(params.options.repoPath)}\``);
  lines.push(`- actionlint_bin: \`${params.options.actionlintBin}\``);
  lines.push(`- workflow_glob: \`${params.lintResult.workflowPath}\``);
  lines.push(`- exit_code: ${params.lintResult.exitCode}`);
  lines.push('');

  if (params.lintResult.output.trim().length === 0) {
    lines.push('## Result');
    lines.push('');
    lines.push('- No issues reported by actionlint.');
    lines.push('');
    return `${lines.join('\n')}\n`;
  }

  lines.push('## Raw Output');
  lines.push('');
  lines.push('```text');
  lines.push(params.lintResult.output.trimEnd());
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));

  const actionlintPath = options.actionlintBin;
  if (
    actionlintPath.includes('/') &&
    !existsSync(resolve(process.cwd(), actionlintPath)) &&
    !existsSync(actionlintPath)
  ) {
    throw new Error(`actionlint binary not found: ${actionlintPath}`);
  }

  const lintResult = runActionlint(options);
  const report = buildMarkdown({
    options,
    lintResult,
  });

  const outPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, report, 'utf8');

  process.stdout.write(`consumer workflow lint report generated at ${outPath}\n`);

  return lintResult.exitCode === 0 ? 0 : 1;
};

process.exitCode = main();
