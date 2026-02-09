import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  ConsumerWorkflowLintCliOptions,
  ConsumerWorkflowLintResult,
} from './consumer-workflow-lint-contract';

export const assertConsumerWorkflowLintBinary = (
  actionlintBin: string,
  cwd: string
): void => {
  if (
    actionlintBin.includes('/') &&
    !existsSync(resolve(cwd, actionlintBin)) &&
    !existsSync(actionlintBin)
  ) {
    throw new Error(`actionlint binary not found: ${actionlintBin}`);
  }
};

export const listConsumerWorkflowFiles = (
  repoPath: string
): ReadonlyArray<string> => {
  const workflowsDir = resolve(repoPath, '.github/workflows');
  return readdirSync(workflowsDir)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => resolve(workflowsDir, name))
    .sort();
};

export const runConsumerWorkflowLint = (
  options: ConsumerWorkflowLintCliOptions
): ConsumerWorkflowLintResult => {
  const workflowsDir = resolve(options.repoPath, '.github/workflows');
  const workflowPath = `${workflowsDir}/*.{yml,yaml}`;
  const workflowFiles = listConsumerWorkflowFiles(options.repoPath);

  if (workflowFiles.length === 0) {
    return {
      exitCode: 0,
      output: 'No workflow files found under .github/workflows',
      workflowPath,
    };
  }

  try {
    const output = execFileSync(
      options.actionlintBin,
      ['-color', '-shellcheck=', '-pyflakes=', ...workflowFiles],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    return {
      exitCode: 0,
      output,
      workflowPath,
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
        workflowPath,
      };
    }
    throw error;
  }
};
