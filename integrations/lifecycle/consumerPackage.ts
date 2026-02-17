import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getCurrentPumukiPackageName } from './packageInfo';

export type ConsumerDependencySource = 'dependencies' | 'devDependencies' | 'none';

type ConsumerPackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const readPackageJson = (repoRoot: string): ConsumerPackageJson => {
  const path = join(repoRoot, 'package.json');
  if (!existsSync(path)) {
    return {};
  }

  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as ConsumerPackageJson;
};

export const resolveCurrentPumukiDependency = (repoRoot: string): {
  source: ConsumerDependencySource;
  spec?: string;
} => {
  const pkg = readPackageJson(repoRoot);
  const dependencyName = getCurrentPumukiPackageName();

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
