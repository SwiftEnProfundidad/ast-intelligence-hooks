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

const hasConfigPayload = (value: ProjectRulesConfig | undefined): boolean => {
  if (!value) {
    return false;
  }
  return value.rules !== undefined || value.allowOverrideLocked !== undefined;
};

const loadFromPath = (configPath: string): ProjectRulesConfig | undefined => {
  if (!existsSync(configPath)) {
    return undefined;
  }

  const loaded: unknown = require(configPath);
  const defaultExport = isObject(loaded) && 'default' in loaded ? loaded.default : undefined;
  const defaultValidated =
    defaultExport !== undefined ? validateProjectRulesConfig(defaultExport) : undefined;
  if (hasConfigPayload(defaultValidated)) {
    return defaultValidated;
  }

  const validated = validateProjectRulesConfig(loaded);
  if (hasConfigPayload(validated)) {
    return validated;
  }

  if (defaultValidated) {
    return defaultValidated;
  }
  if (validated) {
    return validated;
  }

  return undefined;
};

export const loadProjectRules = (): ProjectRulesConfig | undefined => {
  const localConfig = resolve(process.cwd(), '.pumuki', 'rules.ts');
  const rootConfig = resolve(process.cwd(), 'pumuki.rules.ts');

  return loadFromPath(localConfig) ?? loadFromPath(rootConfig);
};
