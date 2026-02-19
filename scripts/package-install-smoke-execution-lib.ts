import type { SmokeMode } from './package-install-smoke-contract';
import { runDefaultSmokeGateSteps } from './package-install-smoke-execution-steps-lib';
import {
  assertLifecycleStatusMatchesSnapshot,
  captureLifecycleStatusSnapshot,
  runLifecycleInstallStep,
  runLifecycleUninstallStep,
} from './package-install-smoke-lifecycle-lib';
import {
  appendSmokeSuccessSummary,
  appendSmokeWorkspaceMetadata,
} from './package-install-smoke-execution-summary-lib';
import { resolveSmokeExpectation } from './package-install-smoke-mode-lib';
import {
  createTarball,
  setupConsumerRepository,
  writeStagedPayload,
} from './package-install-smoke-repo-setup-lib';
import {
  cleanupWorkspace,
  createSmokeWorkspace,
  writeFailureReport,
  writeSuccessReport,
} from './package-install-smoke-workspace-lib';

export const runPackageInstallSmoke = (mode: SmokeMode): void => {
  const workspace = createSmokeWorkspace(mode);
  const expectation = resolveSmokeExpectation(mode);

  try {
    const tarball = createTarball(workspace);
    workspace.tarballPath = tarball.tarballPath;
    appendSmokeWorkspaceMetadata({
      workspace,
      mode,
      tarballId: tarball.id,
    });

    setupConsumerRepository(workspace, mode);
    writeStagedPayload(workspace, mode);

    const lifecycleStatusSnapshot = captureLifecycleStatusSnapshot(workspace);
    runLifecycleInstallStep(workspace);

    const results = runDefaultSmokeGateSteps({
      workspace,
      expectation,
    });

    runLifecycleUninstallStep(workspace);
    const lifecycleStatusAfterUninstall = assertLifecycleStatusMatchesSnapshot({
      workspace,
      snapshot: lifecycleStatusSnapshot,
    });

    appendSmokeSuccessSummary({
      workspace,
      results,
      lifecycleStatusSnapshot,
      lifecycleStatusAfterUninstall,
    });

    writeSuccessReport(workspace);
  } catch (error) {
    writeFailureReport(
      workspace,
      error instanceof Error ? error : new Error('unknown package smoke failure')
    );
    throw error;
  } finally {
    cleanupWorkspace(workspace);
  }
};
