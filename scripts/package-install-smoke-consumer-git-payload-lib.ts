import type { SmokeMode } from './package-install-smoke-contract';
import {
  writeBaselineFile,
  writeRangePayloadFiles,
  writeStagedOnlyFile,
  writeStagedOnlyViolationFile,
} from './package-install-smoke-fixtures-lib';
import { runGitStep } from './package-install-smoke-consumer-git-repo-lib';
import type { SmokeWorkspace } from './package-install-smoke-workspace-lib';

export const commitBaseline = (
  workspace: SmokeWorkspace
): void => {
  writeBaselineFile(workspace.consumerRepo);
  runGitStep(workspace, ['add', '.'], 'git add baseline');
  runGitStep(workspace, ['commit', '-m', 'chore: baseline'], 'git commit baseline');
};

export const writeAndCommitRangePayloadForBlockMode = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  if (mode !== 'block') {
    return;
  }

  writeRangePayloadFiles(workspace.consumerRepo);
  runGitStep(workspace, ['add', '.'], 'git add range payload');
  runGitStep(
    workspace,
    ['commit', '-m', 'test: range payload for package smoke'],
    'git commit range payload'
  );
};

export const writeStagedPayload = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  const stagedFile =
    mode === 'block'
      ? writeStagedOnlyViolationFile(workspace.consumerRepo)
      : writeStagedOnlyFile(workspace.consumerRepo);
  runGitStep(workspace, ['add', stagedFile], 'git add staged-only payload');
};
