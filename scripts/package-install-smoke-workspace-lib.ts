import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { SmokeMode } from './package-install-smoke-contract';
import {
  REPORTS_DIR_ROOT,
  ensureDirectory,
  writeReportFile,
  type RunCommandResult,
} from './package-install-smoke-runner-common';

export type SmokeWorkspace = {
  repoRoot: string;
  reportsDir: string;
  reportRoot: string;
  tmpRoot: string;
  consumerRepo: string;
  bareRemote: string;
  commandLog: string[];
  summary: string[];
  tarballPath?: string;
};

export const pushCommandLog = (
  commandLog: string[],
  result: RunCommandResult
): void => {
  commandLog.push(`$ ${result.command}\n${result.combined}`.trim());
};

export const createSmokeWorkspace = (mode: SmokeMode): SmokeWorkspace => {
  const repoRoot = resolve(process.cwd());
  const reportsDir = join(REPORTS_DIR_ROOT, mode);
  const reportRoot = join(repoRoot, reportsDir);
  ensureDirectory(reportRoot);

  const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-package-smoke-'));
  const consumerRepo = join(tmpRoot, 'consumer');
  const bareRemote = join(tmpRoot, 'origin.git');

  return {
    repoRoot,
    reportsDir,
    reportRoot,
    tmpRoot,
    consumerRepo,
    bareRemote,
    commandLog: [],
    summary: ['# Package Install Smoke Report', ''],
  };
};

export const writeFailureReport = (
  workspace: SmokeWorkspace,
  error: Error
): void => {
  workspace.summary.push('- Status: FAIL');
  workspace.summary.push(`- Error: ${error.message}`);
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'command.log'),
    workspace.commandLog.join('\n\n')
  );
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'summary.md'),
    workspace.summary.join('\n')
  );
};

export const writeSuccessReport = (workspace: SmokeWorkspace): void => {
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'command.log'),
    workspace.commandLog.join('\n\n')
  );
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'summary.md'),
    workspace.summary.join('\n')
  );
};

export const cleanupWorkspace = (workspace: SmokeWorkspace): void => {
  if (workspace.tarballPath) {
    rmSync(workspace.tarballPath, { force: true });
  }
  rmSync(workspace.tmpRoot, { recursive: true, force: true });
};
