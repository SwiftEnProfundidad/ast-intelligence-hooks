import type { SmokeMode } from './package-install-smoke-contract';
import {
  ensureDirectory,
} from './package-install-smoke-runner-common';
import {
  commitBaseline,
  configureRemoteAndFeatureBranch,
  initializeConsumerGitRepository,
  writeAndCommitRangePayloadForBlockMode,
} from './package-install-smoke-consumer-git-lib';
import {
  installTarballIntoConsumerRepo,
  verifyInstalledPackageCanBeRequired,
} from './package-install-smoke-consumer-npm-lib';
import type { SmokeWorkspace } from './package-install-smoke-workspace-lib';

export const setupConsumerRepository = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  ensureDirectory(workspace.consumerRepo);

  initializeConsumerGitRepository(workspace);
  installTarballIntoConsumerRepo(workspace);
  verifyInstalledPackageCanBeRequired(workspace);
  commitBaseline(workspace);
  configureRemoteAndFeatureBranch(workspace);
  writeAndCommitRangePayloadForBlockMode(workspace, mode);
};

export { writeStagedPayload } from './package-install-smoke-consumer-git-lib';
