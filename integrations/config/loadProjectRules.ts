import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ProjectRulesConfig } from './projectRules';
import { projectRulesConfigSchema } from './projectRulesSchema';

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const validateProjectRulesConfig = (value: unknown): ProjectRulesConfig | undefined => {
  const result = projectRulesConfigSchema.safeParse(value);
  if (result.success) {
    return result.data as ProjectRulesConfig;
  }
  console.warn(
    `[pumuki] Invalid project rules config: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
  );
  return undefined;
};

const loadFromPath = (configPath: string): ProjectRulesConfig | undefined => {
  if (!existsSync(configPath)) {
    return undefined;
  }

  const loaded: unknown = require(configPath);
  const validated = validateProjectRulesConfig(loaded);
  if (validated) {
    return validated;
  }
  if (isObject(loaded) && 'default' in loaded) {
    return validateProjectRulesConfig(loaded.default);
  }

  return undefined;
};

export const loadProjectRules = (): ProjectRulesConfig | undefined => {
  const localConfig = resolve(process.cwd(), '.pumuki', 'rules.ts');
  const rootConfig = resolve(process.cwd(), 'pumuki.rules.ts');

  return loadFromPath(localConfig) ?? loadFromPath(rootConfig);
};
