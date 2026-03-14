import { resolve } from 'node:path';
import { compileSkillsLock } from './compileSkillsLock';
import { loadSkillsLock, type SkillsLockV1 } from './skillsLock';

const CORE_MANIFEST_FILE = 'skills.sources.json';
const CORE_GENERATED_AT = '2026-02-22T00:00:00.000Z';
const PACKAGE_ROOT = resolve(__dirname, '..', '..');

let cachedCoreSkillsLock: SkillsLockV1 | undefined;

export const resolveCoreSkillsLockForPackageRoot = (
  packageRoot: string
): SkillsLockV1 | undefined => {
  try {
    const compiledLock = compileSkillsLock({
      repoRoot: packageRoot,
      manifestFile: CORE_MANIFEST_FILE,
      generatedAt: CORE_GENERATED_AT,
    });
    if (compiledLock.bundles.length > 0) {
      return compiledLock;
    }
  } catch {
  }

  return loadSkillsLock(packageRoot);
};

export const loadCoreSkillsLock = (): SkillsLockV1 | undefined => {
  if (cachedCoreSkillsLock) {
    return cachedCoreSkillsLock;
  }

  cachedCoreSkillsLock = resolveCoreSkillsLockForPackageRoot(PACKAGE_ROOT);
  return cachedCoreSkillsLock;
};

export const __resetCoreSkillsLockCacheForTests = (): void => {
  cachedCoreSkillsLock = undefined;
};
