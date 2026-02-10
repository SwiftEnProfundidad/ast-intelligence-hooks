import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  ConsumerWorkflowLintCliOptions,
  ConsumerWorkflowLintResult,
} from './consumer-workflow-lint-contract';
import { executeConsumerWorkflowLintCommand } from './consumer-workflow-lint-command-lib';

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

  return executeConsumerWorkflowLintCommand({
    options,
    workflowFiles,
    workflowPath,
  });
};
