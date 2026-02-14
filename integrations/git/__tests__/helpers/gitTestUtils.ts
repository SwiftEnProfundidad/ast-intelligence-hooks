import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type RunGitOptions = {
  trimOutput?: boolean;
};

export type TempRepoOptions = {
  mainBranch?: string;
  seedInitialCommit?: boolean;
  tempPrefix?: string;
};

export const runGit = (
  cwd: string,
  args: ReadonlyArray<string>,
  options: RunGitOptions = {}
): string => {
  const output = execFileSync('git', args, { cwd, encoding: 'utf8' });
  return options.trimOutput === false ? output : output.trim();
};

export const withTempRepo = async (
  callback: (repoRoot: string) => Promise<void>,
  options: TempRepoOptions = {}
): Promise<void> => {
  const repoRoot = mkdtempSync(join(tmpdir(), options.tempPrefix ?? 'pumuki-git-test-'));
  const previousCwd = process.cwd();
  const mainBranch = options.mainBranch ?? 'main';
  const seedInitialCommit = options.seedInitialCommit ?? false;

  try {
    runGit(repoRoot, ['init']);
    runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
    runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
    runGit(repoRoot, ['branch', '-M', mainBranch]);

    if (seedInitialCommit) {
      writeFileSync(join(repoRoot, 'README.md'), '# temp repo\n', 'utf8');
      runGit(repoRoot, ['add', 'README.md']);
      runGit(repoRoot, ['commit', '-m', 'chore: initial commit']);
    }

    process.chdir(repoRoot);
    await callback(repoRoot);
  } finally {
    process.chdir(previousCwd);
    rmSync(repoRoot, { recursive: true, force: true });
  }
};

export const withGithubBaseRef = async (
  ref: string | undefined,
  callback: () => Promise<void>
): Promise<void> => {
  const previous = process.env.GITHUB_BASE_REF;
  if (typeof ref === 'undefined') {
    delete process.env.GITHUB_BASE_REF;
  } else {
    process.env.GITHUB_BASE_REF = ref;
  }

  try {
    await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.GITHUB_BASE_REF;
    } else {
      process.env.GITHUB_BASE_REF = previous;
    }
  }
};

export const withSilencedConsoleLog = async (
  callback: () => Promise<void>
): Promise<void> => {
  const originalConsoleLog = console.log;
  console.log = () => {};

  try {
    await callback();
  } finally {
    console.log = originalConsoleLog;
  }
};
