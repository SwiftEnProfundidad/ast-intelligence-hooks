import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  detectOpenSpecInstallation,
  evaluateOpenSpecCompatibility,
  isOpenSpecProjectInitialized,
  OPENSPEC_NPM_PACKAGE_NAME,
} from '../sdd/openSpecCli';
import { LifecycleNpmService, type ILifecycleNpmService } from './npmService';

export type OpenSpecBootstrapResult = {
  repoRoot: string;
  packageInstalled: boolean;
  projectInitialized: boolean;
  actions: ReadonlyArray<string>;
  managedArtifacts: ReadonlyArray<string>;
  skippedReason?: 'NO_PACKAGE_JSON';
};

type PackageDependencySource = 'dependencies' | 'devDependencies' | 'none';

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const readPackageJson = (repoRoot: string): PackageJson | undefined => {
  const packageJsonPath = join(repoRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return undefined;
  }
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
};

const resolveDependencySource = (
  packageJson: PackageJson | undefined,
  dependencyName: string
): PackageDependencySource => {
  if (!packageJson) {
    return 'none';
  }
  if (typeof packageJson.dependencies?.[dependencyName] === 'string') {
    return 'dependencies';
  }
  if (typeof packageJson.devDependencies?.[dependencyName] === 'string') {
    return 'devDependencies';
  }
  return 'none';
};

const OPENSPEC_LEGACY_NPM_PACKAGE_NAME = 'openspec';
const OPENSPEC_PROJECT_MD = 'openspec/project.md';
const OPENSPEC_ARCHIVE_GITKEEP = 'openspec/changes/archive/.gitkeep';
const OPENSPEC_SPECS_GITKEEP = 'openspec/specs/.gitkeep';

export type OpenSpecCompatibilityMigrationResult = {
  repoRoot: string;
  migratedLegacyPackage: boolean;
  migratedFrom?: Exclude<PackageDependencySource, 'none'>;
  actions: ReadonlyArray<string>;
};

const scaffoldOpenSpecProject = (repoRoot: string): ReadonlyArray<string> => {
  const openspecRoot = join(repoRoot, 'openspec');
  const changesRoot = join(openspecRoot, 'changes');
  const archiveRoot = join(changesRoot, 'archive');
  const specsRoot = join(openspecRoot, 'specs');

  const projectDescriptionPath = join(repoRoot, OPENSPEC_PROJECT_MD);
  const archiveKeepPath = join(repoRoot, OPENSPEC_ARCHIVE_GITKEEP);
  const specsKeepPath = join(repoRoot, OPENSPEC_SPECS_GITKEEP);

  const managedArtifacts: string[] = [];

  const ensureDirectory = (directoryPath: string): void => {
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }
  };

  ensureDirectory(openspecRoot);
  ensureDirectory(changesRoot);
  ensureDirectory(archiveRoot);
  ensureDirectory(specsRoot);

  if (!existsSync(projectDescriptionPath)) {
    writeFileSync(
      projectDescriptionPath,
      [
        '# OpenSpec Project',
        '',
        'This repository is bootstrapped by Pumuki for SDD/OpenSpec workflows.',
        'Update this document with project context and design constraints.',
        '',
      ].join('\n'),
      'utf8'
    );
    managedArtifacts.push(OPENSPEC_PROJECT_MD);
  }

  if (!existsSync(archiveKeepPath)) {
    writeFileSync(archiveKeepPath, '', 'utf8');
    managedArtifacts.push(OPENSPEC_ARCHIVE_GITKEEP);
  }

  if (!existsSync(specsKeepPath)) {
    writeFileSync(specsKeepPath, '', 'utf8');
    managedArtifacts.push(OPENSPEC_SPECS_GITKEEP);
  }

  return managedArtifacts;
};

export const runOpenSpecCompatibilityMigration = (params: {
  repoRoot: string;
  npm?: ILifecycleNpmService;
}): OpenSpecCompatibilityMigrationResult => {
  const npm = params.npm ?? new LifecycleNpmService();
  const packageJson = readPackageJson(params.repoRoot);
  const legacySource = resolveDependencySource(
    packageJson,
    OPENSPEC_LEGACY_NPM_PACKAGE_NAME
  );
  if (legacySource === 'none') {
    return {
      repoRoot: params.repoRoot,
      migratedLegacyPackage: false,
      actions: [],
    };
  }

  const actions: string[] = [];
  npm.runNpm(['uninstall', OPENSPEC_LEGACY_NPM_PACKAGE_NAME], params.repoRoot);
  actions.push(`npm-uninstall:${OPENSPEC_LEGACY_NPM_PACKAGE_NAME}`);

  const installArgs =
    legacySource === 'dependencies'
      ? ['install', '--save-exact', `${OPENSPEC_NPM_PACKAGE_NAME}@latest`]
      : ['install', '--save-dev', '--save-exact', `${OPENSPEC_NPM_PACKAGE_NAME}@latest`];

  npm.runNpm(installArgs, params.repoRoot);
  actions.push(`npm-install:${OPENSPEC_NPM_PACKAGE_NAME}@latest`);

  return {
    repoRoot: params.repoRoot,
    migratedLegacyPackage: true,
    migratedFrom: legacySource,
    actions,
  };
};

export const runOpenSpecBootstrap = (params: {
  repoRoot: string;
  npm?: ILifecycleNpmService;
}): OpenSpecBootstrapResult => {
  const npm = params.npm ?? new LifecycleNpmService();
  const actions: string[] = [];

  const installation = detectOpenSpecInstallation(params.repoRoot);
  const compatibility = evaluateOpenSpecCompatibility(installation);
  let packageInstalled = installation.installed;
  const packageJsonPath = join(params.repoRoot, 'package.json');
  const hasPackageJson = existsSync(packageJsonPath);

  if ((!packageInstalled || !compatibility.compatible) && hasPackageJson) {
    npm.runNpm(
      ['install', '--save-dev', '--save-exact', `${OPENSPEC_NPM_PACKAGE_NAME}@latest`],
      params.repoRoot
    );
    packageInstalled = true;
    actions.push(`npm-install:${OPENSPEC_NPM_PACKAGE_NAME}@latest`);
  }

  const projectInitializedBefore = isOpenSpecProjectInitialized(params.repoRoot);
  const managedArtifacts = !projectInitializedBefore
    ? scaffoldOpenSpecProject(params.repoRoot)
    : [];
  if (managedArtifacts.length > 0) {
    actions.push('scaffold:openspec-project');
  }

  return {
    repoRoot: params.repoRoot,
    packageInstalled,
    projectInitialized: isOpenSpecProjectInitialized(params.repoRoot),
    actions,
    managedArtifacts,
    skippedReason: !packageInstalled && !hasPackageJson ? 'NO_PACKAGE_JSON' : undefined,
  };
};
