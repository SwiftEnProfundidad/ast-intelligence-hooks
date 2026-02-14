import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const preferredLegacyRulesDirectories = ['.cursor', '.adapter'];

const listLegacyRulesDirectories = (legacyToolingRoot: string): string[] => {
  if (!existsSync(legacyToolingRoot)) {
    return [];
  }

  return readdirSync(legacyToolingRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
};

export const resolveLegacyRulesetFile = (
  fileName: 'rulesgold.mdc' | 'rulesbackend.mdc',
  repoRoot: string = process.cwd()
): string | undefined => {
  const legacyToolingRoot = join(repoRoot, 'legacy', 'tooling');
  const discoveredDirectories = listLegacyRulesDirectories(legacyToolingRoot).filter(
    (directory) => !preferredLegacyRulesDirectories.includes(directory)
  );

  const candidates = [...preferredLegacyRulesDirectories, ...discoveredDirectories].map(
    (directory) => join(legacyToolingRoot, directory, 'rules', fileName)
  );

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
};
