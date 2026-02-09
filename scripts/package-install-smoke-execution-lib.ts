import type { SmokeMode } from './package-install-smoke-contract';
import { resolveSmokeExpectation } from './package-install-smoke-mode-lib';
import { runGateStep } from './package-install-smoke-gate-lib';
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
    workspace.summary.push(`- Repository root: \`${workspace.repoRoot}\``);
    workspace.summary.push(`- Temporary workspace: \`${workspace.tmpRoot}\``);
    workspace.summary.push('');

    const tarball = createTarball(workspace);
    workspace.tarballPath = tarball.tarballPath;
    workspace.summary.push(`- Smoke mode: \`${mode}\``);
    workspace.summary.push(`- Packed tarball: \`${tarball.id}\``);

    setupConsumerRepository(workspace, mode);
    writeStagedPayload(workspace, mode);

    const preCommit = runGateStep(
      workspace,
      {
        label: 'pre-commit',
        command: 'npx',
        args: ['--yes', 'pumuki-pre-commit'],
        evidenceFile: 'pre-commit.ai_evidence.json',
        stage: 'PRE_COMMIT',
      },
      expectation
    );

    const prePush = runGateStep(
      workspace,
      {
        label: 'pre-push',
        command: 'npx',
        args: ['--yes', 'pumuki-pre-push'],
        evidenceFile: 'pre-push.ai_evidence.json',
        stage: 'PRE_PUSH',
      },
      expectation
    );

    const ci = runGateStep(
      workspace,
      {
        label: 'ci',
        command: 'npx',
        args: ['--yes', 'pumuki-ci'],
        evidenceFile: 'ci.ai_evidence.json',
        stage: 'CI',
      },
      expectation
    );

    workspace.summary.push('- Status: PASS');
    workspace.summary.push(`- pre-commit exit: \`${preCommit.exitCode}\` (${preCommit.outcome})`);
    workspace.summary.push(`- pre-push exit: \`${prePush.exitCode}\` (${prePush.outcome})`);
    workspace.summary.push(`- ci exit: \`${ci.exitCode}\` (${ci.outcome})`);
    workspace.summary.push(`- Artifact root: \`${workspace.reportsDir}\``);

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
