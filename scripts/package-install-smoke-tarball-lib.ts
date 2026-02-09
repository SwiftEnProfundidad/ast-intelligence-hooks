import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertSuccess,
  runCommand,
} from './package-install-smoke-runner-common';
import {
  pushCommandLog,
  type SmokeWorkspace,
} from './package-install-smoke-workspace-lib';

export const createTarball = (
  workspace: SmokeWorkspace
): { id: string; tarballPath: string } => {
  const packResult = runCommand({
    cwd: workspace.repoRoot,
    executable: 'npm',
    args: ['pack', '--json'],
  });
  pushCommandLog(workspace.commandLog, packResult);
  assertSuccess(packResult, 'npm pack --json');

  const packInfo = JSON.parse(packResult.stdout) as Array<{ filename: string; id: string }>;
  if (!Array.isArray(packInfo) || packInfo.length === 0 || !packInfo[0]?.filename) {
    throw new Error('npm pack --json did not return a valid tarball payload');
  }

  const tarballPath = join(workspace.repoRoot, packInfo[0].filename);
  if (!existsSync(tarballPath)) {
    throw new Error(`Packed tarball not found at ${tarballPath}`);
  }

  return { id: packInfo[0].id, tarballPath };
};
