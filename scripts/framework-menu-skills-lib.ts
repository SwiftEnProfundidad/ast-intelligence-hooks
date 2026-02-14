import { type SkillsLockBundle, loadSkillsLock } from '../integrations/config/skillsLock';

export const formatActiveSkillsBundles = (
  bundles: ReadonlyArray<Pick<SkillsLockBundle, 'name' | 'version' | 'hash'>>
): string => {
  if (bundles.length === 0) {
    return 'No active skills bundles found. Run `npm run skills:compile` to generate skills.lock.json.';
  }

  const lines = [...bundles]
    .sort((left, right) => {
      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) {
        return byName;
      }
      return left.version.localeCompare(right.version);
    })
    .map((bundle) => `- ${bundle.name}@${bundle.version} hash=${bundle.hash}`);

  return ['Active skills bundles:', ...lines].join('\n');
};

export const loadAndFormatActiveSkillsBundles = (repoRoot: string): string => {
  const lock = loadSkillsLock(repoRoot);
  return formatActiveSkillsBundles(lock?.bundles ?? []);
};
