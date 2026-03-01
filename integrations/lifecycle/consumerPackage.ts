import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCurrentPumukiPackageName } from './packageInfo';

export type ConsumerDependencySource = 'dependencies' | 'devDependencies' | 'none';

type ConsumerPackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const readPackageJson = (repoRoot: string): ConsumerPackageJson => {
  const path = join(repoRoot, 'package.json');
  if (!existsSync(path)) {
    return {};
  }

  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as ConsumerPackageJson;
};

export const resolveDeclaredDependency = (params: {
  repoRoot: string;
  dependencyName: string;
}): {
  source: ConsumerDependencySource;
  spec?: string;
} => {
  const pkg = readPackageJson(params.repoRoot);
  const dependencyName = params.dependencyName;

  const dependencySpec = pkg.dependencies?.[dependencyName];
  if (typeof dependencySpec === 'string') {
    return {
      source: 'dependencies',
      spec: dependencySpec,
    };
  }

  const devDependencySpec = pkg.devDependencies?.[dependencyName];
  if (typeof devDependencySpec === 'string') {
    return {
      source: 'devDependencies',
      spec: devDependencySpec,
    };
  }

  return {
    source: 'none',
  };
};

export const resolveCurrentPumukiDependency = (repoRoot: string): {
  source: ConsumerDependencySource;
  spec?: string;
} =>
  resolveDeclaredDependency({
    repoRoot,
    dependencyName: getCurrentPumukiPackageName(),
  });

export const hasDeclaredDependenciesBeyondPumuki = (repoRoot: string): boolean => {
  const pkg = readPackageJson(repoRoot);
  const pumukiPackage = getCurrentPumukiPackageName();
  const ignoredPackages = new Set([pumukiPackage, 'pumuki-ast-hooks']);

  const hasExternalDependency = (section?: Record<string, string>): boolean => {
    if (!section) {
      return false;
    }
    return Object.keys(section).some((dependencyName) => !ignoredPackages.has(dependencyName));
  };

  return (
    hasExternalDependency(pkg.dependencies) ||
    hasExternalDependency(pkg.devDependencies) ||
    hasExternalDependency(pkg.optionalDependencies) ||
    hasExternalDependency(pkg.peerDependencies)
  );
};
