import type { SmokeMode } from './package-install-smoke-contract';
import type { SmokeWorkspace } from './package-install-smoke-workspace-contract';
import type { SmokeStepResult } from './package-install-smoke-execution-steps-lib';

export const appendSmokeWorkspaceMetadata = (params: {
  workspace: SmokeWorkspace;
  mode: SmokeMode;
  tarballId: string;
}): void => {
  params.workspace.summary.push(`- Repository root: \`${params.workspace.repoRoot}\``);
  params.workspace.summary.push(`- Temporary workspace: \`${params.workspace.tmpRoot}\``);
  params.workspace.summary.push('');
  params.workspace.summary.push(`- Smoke mode: \`${params.mode}\``);
  params.workspace.summary.push(`- Packed tarball: \`${params.tarballId}\``);
};

const findStepResult = (
  results: ReadonlyArray<SmokeStepResult>,
  label: SmokeStepResult['label']
): SmokeStepResult => {
  const result = results.find((entry) => entry.label === label);
  if (!result) {
    throw new Error(`Missing smoke step result for ${label}`);
  }
  return result;
};

export const appendSmokeSuccessSummary = (params: {
  workspace: SmokeWorkspace;
  results: ReadonlyArray<SmokeStepResult>;
}): void => {
  const preCommit = findStepResult(params.results, 'pre-commit');
  const prePush = findStepResult(params.results, 'pre-push');
  const ci = findStepResult(params.results, 'ci');

  params.workspace.summary.push('- Status: PASS');
  params.workspace.summary.push(`- pre-commit exit: \`${preCommit.exitCode}\` (${preCommit.outcome})`);
  params.workspace.summary.push(`- pre-push exit: \`${prePush.exitCode}\` (${prePush.outcome})`);
  params.workspace.summary.push(`- ci exit: \`${ci.exitCode}\` (${ci.outcome})`);
  params.workspace.summary.push(`- Artifact root: \`${params.workspace.reportsDir}\``);
};
