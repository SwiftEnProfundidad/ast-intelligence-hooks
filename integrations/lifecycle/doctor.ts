import { getPumukiHooksStatus } from './hookManager';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { getCurrentPumukiVersion } from './packageInfo';
import { readLifecycleState, type LifecycleState } from './state';

export type DoctorIssueSeverity = 'warning' | 'error';

export type DoctorIssue = {
  severity: DoctorIssueSeverity;
  message: string;
};

export type LifecycleDoctorReport = {
  repoRoot: string;
  packageVersion: string;
  lifecycleState: LifecycleState;
  trackedNodeModulesPaths: ReadonlyArray<string>;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  issues: ReadonlyArray<DoctorIssue>;
};

const buildDoctorIssues = (params: {
  trackedNodeModulesPaths: ReadonlyArray<string>;
  hookStatus: ReturnType<typeof getPumukiHooksStatus>;
  lifecycleState: LifecycleState;
}): ReadonlyArray<DoctorIssue> => {
  const issues: DoctorIssue[] = [];

  if (params.trackedNodeModulesPaths.length > 0) {
    issues.push({
      severity: 'error',
      message:
        'Tracked files under node_modules were detected. This baseline is unsafe for enterprise install/uninstall lifecycle.',
    });
  }

  if (
    params.lifecycleState.installed === 'true' &&
    !Object.values(params.hookStatus).every((entry) => entry.managedBlockPresent)
  ) {
    issues.push({
      severity: 'warning',
      message:
        'Lifecycle state says installed=true but one or more managed hook blocks are missing.',
    });
  }

  if (
    params.lifecycleState.installed !== 'true' &&
    Object.values(params.hookStatus).some((entry) => entry.managedBlockPresent)
  ) {
    issues.push({
      severity: 'warning',
      message:
        'Managed hook blocks exist but lifecycle state is not marked as installed.',
    });
  }

  return issues;
};

export const runLifecycleDoctor = (params?: {
  cwd?: string;
  git?: ILifecycleGitService;
}): LifecycleDoctorReport => {
  const git = params?.git ?? new LifecycleGitService();
  const cwd = params?.cwd ?? process.cwd();
  const repoRoot = git.resolveRepoRoot(cwd);
  const trackedNodeModulesPaths = git.trackedNodeModulesPaths(repoRoot);
  const hookStatus = getPumukiHooksStatus(repoRoot);
  const lifecycleState = readLifecycleState(git, repoRoot);

  const issues = buildDoctorIssues({
    trackedNodeModulesPaths,
    hookStatus,
    lifecycleState,
  });

  return {
    repoRoot,
    packageVersion: getCurrentPumukiVersion(),
    lifecycleState,
    trackedNodeModulesPaths,
    hookStatus,
    issues,
  };
};

export const doctorHasBlockingIssues = (report: LifecycleDoctorReport): boolean =>
  report.issues.some((issue) => issue.severity === 'error');
