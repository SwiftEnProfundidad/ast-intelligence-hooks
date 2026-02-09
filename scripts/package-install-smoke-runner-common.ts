import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type RunCommandResult = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  combined: string;
};

const FATAL_OUTPUT_PATTERNS = [
  'Cannot find module',
  'ERR_MODULE_NOT_FOUND',
  'failed to resolve tsx runtime',
];

export const REPORTS_DIR_ROOT = join('.audit-reports', 'package-smoke');

export const ensureDirectory = (path: string): void => {
  mkdirSync(path, { recursive: true });
};

export const writeReportFile = (
  repoRoot: string,
  relativePath: string,
  content: string
): void => {
  const filePath = join(repoRoot, relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(filePath, content, 'utf8');
};

export const runCommand = (params: {
  cwd: string;
  executable: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
}): RunCommandResult => {
  const { cwd, executable, args, env } = params;
  const command = `${executable} ${args.join(' ')}`.trim();
  const result = spawnSync(executable, args, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  });

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combined = `${stdout}${stderr}`;
  const exitCode =
    typeof result.status === 'number'
      ? result.status
      : result.error
        ? 1
        : 0;

  return { command, exitCode, stdout, stderr, combined };
};

export const assertSuccess = (result: RunCommandResult, context: string): void => {
  if (result.exitCode !== 0) {
    throw new Error(
      `${context} failed (${result.command}) with exit code ${result.exitCode}\n${result.combined}`
    );
  }
};

export const assertNoFatalOutput = (
  result: RunCommandResult,
  context: string
): void => {
  const failingPattern = FATAL_OUTPUT_PATTERNS.find((pattern) =>
    result.combined.includes(pattern)
  );
  if (failingPattern) {
    throw new Error(
      `${context} output contains fatal pattern "${failingPattern}"\n${result.combined}`
    );
  }
};

export const parseEvidence = (
  filePath: string
): { version: string; stage: string; outcome: string } => {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as {
    version?: string;
    snapshot?: { stage?: string; outcome?: string };
  };

  return {
    version: parsed.version ?? 'missing',
    stage: parsed.snapshot?.stage ?? 'missing',
    outcome: parsed.snapshot?.outcome ?? 'missing',
  };
};
