import { resolve } from 'node:path';
import { compileSkillsLock } from './compileSkillsLock';
import type { SkillsLockV1 } from './skillsLock';

const CORE_MANIFEST_FILE = 'skills.sources.json';
const CORE_GENERATED_AT = '2026-02-22T00:00:00.000Z';
const PACKAGE_ROOT = resolve(__dirname, '..', '..');

let cachedCoreSkillsLock: SkillsLockV1 | undefined;

export const loadCoreSkillsLock = (): SkillsLockV1 | undefined => {
  if (cachedCoreSkillsLock) {
    return cachedCoreSkillsLock;
  }

  try {
    cachedCoreSkillsLock = compileSkillsLock({
      repoRoot: PACKAGE_ROOT,
      manifestFile: CORE_MANIFEST_FILE,
      generatedAt: CORE_GENERATED_AT,
    });
    return cachedCoreSkillsLock;
  } catch {
    return undefined;
  }
};

export const __resetCoreSkillsLockCacheForTests = (): void => {
  cachedCoreSkillsLock = undefined;
};
