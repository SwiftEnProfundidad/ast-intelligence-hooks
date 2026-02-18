import { installPumukiHooks } from './hookManager';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { doctorHasBlockingIssues, runLifecycleDoctor } from './doctor';
import { runOpenSpecBootstrap, type OpenSpecBootstrapResult } from './openSpecBootstrap';
import { LifecycleNpmService, type ILifecycleNpmService } from './npmService';
import { getCurrentPumukiVersion } from './packageInfo';
import { readOpenSpecManagedArtifacts, writeLifecycleState } from './state';

export type LifecycleInstallResult = {
  repoRoot: string;
  version: string;
  changedHooks: ReadonlyArray<string>;
  openSpecBootstrap?: OpenSpecBootstrapResult;
};

export const runLifecycleInstall = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
  npm?: ILifecycleNpmService;
  bootstrapOpenSpec?: boolean;
}): LifecycleInstallResult => {
  const git = params?.git ?? new LifecycleGitService();
  const report = runLifecycleDoctor({
    cwd: params?.cwd,
    git,
  });

  if (doctorHasBlockingIssues(report)) {
    const renderedIssues = report.issues.map((issue) => `- [${issue.severity}] ${issue.message}`).join('\n');
    throw new Error(
      `pumuki install blocked by repository safety checks.\n${renderedIssues}\n` +
      'Fix the baseline (for example tracked node_modules) and retry.'
    );
  }

  const shouldBootstrapOpenSpec =
    params?.bootstrapOpenSpec ?? process.env.PUMUKI_SKIP_OPENSPEC_BOOTSTRAP !== '1';

  const openSpecBootstrap = shouldBootstrapOpenSpec
    ? runOpenSpecBootstrap({
      repoRoot: report.repoRoot,
      npm: params?.npm ?? new LifecycleNpmService(),
    })
    : undefined;

  const hookResult = installPumukiHooks(report.repoRoot);
  const version = getCurrentPumukiVersion();
  const mergedOpenSpecArtifacts = new Set(
    readOpenSpecManagedArtifacts(git, report.repoRoot)
  );
  for (const artifact of openSpecBootstrap?.managedArtifacts ?? []) {
    mergedOpenSpecArtifacts.add(artifact);
  }
  writeLifecycleState({
    git,
    repoRoot: report.repoRoot,
    version,
    openSpecManagedArtifacts: Array.from(mergedOpenSpecArtifacts),
  });

  return {
    repoRoot: report.repoRoot,
    version,
    changedHooks: hookResult.changedHooks,
    openSpecBootstrap,
  };
};
