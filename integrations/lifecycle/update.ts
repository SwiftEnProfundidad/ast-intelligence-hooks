import { resolveCurrentPumukiDependency } from './consumerPackage';
import { doctorHasBlockingIssues, runLifecycleDoctor } from './doctor';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';
import { runLifecycleInstall } from './install';
import { LifecycleNpmService, type ILifecycleNpmService } from './npmService';
import {
  runOpenSpecCompatibilityMigration,
  type OpenSpecCompatibilityMigrationResult,
} from './openSpecBootstrap';
import { getCurrentPumukiPackageName } from './packageInfo';

export type LifecycleUpdateResult = {
  repoRoot: string;
  targetSpec: string;
  reinstallHooksChanged: ReadonlyArray<string>;
  openSpecCompatibility: OpenSpecCompatibilityMigrationResult;
};

const resolveTargetSpec = (explicitSpec?: string): string => {
  if (typeof explicitSpec === 'string' && explicitSpec.trim().length > 0) {
    return explicitSpec.trim();
  }
  return `${getCurrentPumukiPackageName()}@latest`;
};

export const runLifecycleUpdate = (params?: {
  cwd?: string;
  targetSpec?: string;
  git?: ILifecycleGitService;
  npm?: ILifecycleNpmService;
}): LifecycleUpdateResult => {
  const git = params?.git ?? new LifecycleGitService();
  const npm = params?.npm ?? new LifecycleNpmService();

  const doctorReport = runLifecycleDoctor({
    cwd: params?.cwd,
    git,
  });
  if (doctorHasBlockingIssues(doctorReport)) {
    const renderedIssues = doctorReport.issues
      .map((issue) => `- [${issue.severity}] ${issue.message}`)
      .join('\n');
    throw new Error(`pumuki update blocked by repository safety checks.\n${renderedIssues}`);
  }

  const targetSpec = resolveTargetSpec(params?.targetSpec);
  const currentDependency = resolveCurrentPumukiDependency(doctorReport.repoRoot);

  const installArgs =
    currentDependency.source === 'dependencies'
      ? ['install', '--save-exact', targetSpec]
      : ['install', '--save-dev', '--save-exact', targetSpec];
  npm.runNpm(installArgs, doctorReport.repoRoot);

  try {
    const openSpecCompatibility = runOpenSpecCompatibilityMigration({
      repoRoot: doctorReport.repoRoot,
      npm,
    });
    const installResult = runLifecycleInstall({
      cwd: doctorReport.repoRoot,
      git,
      bootstrapOpenSpec: false,
    });
    return {
      repoRoot: installResult.repoRoot,
      targetSpec,
      reinstallHooksChanged: installResult.changedHooks,
      openSpecCompatibility,
    };
  } catch (error) {
    if (currentDependency.spec) {
      const rollbackArgs =
        currentDependency.source === 'dependencies'
          ? ['install', '--save-exact', `${getCurrentPumukiPackageName()}@${currentDependency.spec}`]
          : [
            'install',
            '--save-dev',
            '--save-exact',
            `${getCurrentPumukiPackageName()}@${currentDependency.spec}`,
          ];
      try {
        npm.runNpm(rollbackArgs, doctorReport.repoRoot);
      } catch {}
    }
    throw error;
  }
};
