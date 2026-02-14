import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { SmokeMode } from './package-install-smoke-contract';
import {
  REPORTS_DIR_ROOT,
  ensureDirectory,
} from './package-install-smoke-runner-common';
import type { SmokeWorkspace } from './package-install-smoke-workspace-contract';

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

export const cleanupWorkspace = (workspace: SmokeWorkspace): void => {
  if (workspace.tarballPath) {
    rmSync(workspace.tarballPath, { force: true });
  }
  rmSync(workspace.tmpRoot, { recursive: true, force: true });
};
