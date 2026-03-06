import { cwd, exit } from 'node:process';
import { collectSelfWorktreeHygieneReport } from './self-worktree-hygiene-lib';

type CliOptions = {
  json: boolean;
  noFail: boolean;
  repoRoot: string;
  maxFiles?: number;
  maxScopes?: number;
};

const parsePositiveInteger = (value: string | undefined): number | undefined => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return parsed;
};

const parseArgs = (argv: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    json: false,
    noFail: false,
    repoRoot: cwd(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--json') {
      options.json = true;
      continue;
    }
    if (argument === '--no-fail') {
      options.noFail = true;
      continue;
    }
    if (argument === '--repo-root' && typeof argv[index + 1] === 'string') {
      options.repoRoot = argv[index + 1] ?? options.repoRoot;
      index += 1;
      continue;
    }
    if (argument === '--max-files' && typeof argv[index + 1] === 'string') {
      options.maxFiles = parsePositiveInteger(argv[index + 1]);
      index += 1;
      continue;
    }
    if (argument === '--max-scopes' && typeof argv[index + 1] === 'string') {
      options.maxScopes = parsePositiveInteger(argv[index + 1]);
      index += 1;
      continue;
    }
  }

  return options;
};

const options = parseArgs(process.argv.slice(2));
const report = collectSelfWorktreeHygieneReport({
  repoRoot: options.repoRoot,
  maxFiles: options.maxFiles,
  maxScopes: options.maxScopes,
});

if (options.json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(`[self-worktree-hygiene] repo=${report.repoRoot}\n`);
  process.stdout.write(`[self-worktree-hygiene] changed_files=${report.changedFiles} max_files=${report.maxFiles}\n`);
  process.stdout.write(`[self-worktree-hygiene] changed_scopes=${report.changedScopes} max_scopes=${report.maxScopes}\n`);

  if (report.scopes.length > 0) {
    const renderedScopes = report.scopes
      .slice(0, 6)
      .map((scope) => `${scope.scope}=${scope.files}`)
      .join(', ');
    process.stdout.write(`[self-worktree-hygiene] top_scopes=${renderedScopes}\n`);
  }

  if (report.blocked) {
    for (const violation of report.violations) {
      process.stderr.write(`[self-worktree-hygiene] ${violation.code}: ${violation.message}\n`);
      process.stderr.write(`[self-worktree-hygiene] remediation: ${violation.remediation}\n`);
    }
  } else {
    process.stdout.write('[self-worktree-hygiene] OK: worktree within maintainer hygiene limits.\n');
  }
}

if (report.blocked && !options.noFail) {
  exit(1);
}
