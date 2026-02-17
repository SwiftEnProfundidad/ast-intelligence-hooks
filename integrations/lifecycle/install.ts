import { installPumukiHooks } from './hookManager';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { doctorHasBlockingIssues, runLifecycleDoctor } from './doctor';
import { getCurrentPumukiVersion } from './packageInfo';
import { writeLifecycleState } from './state';

export type LifecycleInstallResult = {
  repoRoot: string;
  version: string;
  changedHooks: ReadonlyArray<string>;
};

export const runLifecycleInstall = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
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

  const hookResult = installPumukiHooks(report.repoRoot);
  const version = getCurrentPumukiVersion();
  writeLifecycleState({
    git,
    repoRoot: report.repoRoot,
    version,
  });

  return {
    repoRoot: report.repoRoot,
    version,
    changedHooks: hookResult.changedHooks,
  };
};
