import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ProjectRulesConfig } from './projectRules';

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isProjectRulesConfig = (value: unknown): value is ProjectRulesConfig => {
  return isObject(value);
};

const loadFromPath = (configPath: string): ProjectRulesConfig | undefined => {
  if (!existsSync(configPath)) {
    return undefined;
  }

  const loaded: unknown = require(configPath);
  if (isProjectRulesConfig(loaded)) {
    return loaded;
  }
  if (isObject(loaded) && 'default' in loaded) {
    const candidate = loaded.default;
    if (isProjectRulesConfig(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

export const loadProjectRules = (): ProjectRulesConfig | undefined => {
  const localConfig = resolve(process.cwd(), '.pumuki', 'rules.ts');
  const rootConfig = resolve(process.cwd(), 'pumuki.rules.ts');

  return loadFromPath(localConfig) ?? loadFromPath(rootConfig);
};
