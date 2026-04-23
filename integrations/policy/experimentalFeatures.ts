export type ExperimentalFeatureId =
  | 'pre_write'
  | 'sdd'
  | 'heuristics'
  | 'mcp_enterprise'
  | 'learning_context'
  | 'analytics'
  | 'operational_memory'
  | 'saas_ingestion';
export type ExperimentalFeatureMode = 'off' | 'advisory' | 'strict';
export type ExperimentalFeatureSource = 'default' | 'env' | 'legacy-env';
export type ExperimentalFeatureLayer = 'experimental';
export type ExperimentalFeatureActivationVariable =
  | 'PUMUKI_EXPERIMENTAL_PRE_WRITE'
  | 'PUMUKI_EXPERIMENTAL_SDD'
  | 'PUMUKI_EXPERIMENTAL_HEURISTICS'
  | 'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE'
  | 'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT'
  | 'PUMUKI_EXPERIMENTAL_ANALYTICS'
  | 'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY'
  | 'PUMUKI_EXPERIMENTAL_SAAS_INGESTION';
export type ExperimentalFeatureLegacyActivationVariable =
  | 'PUMUKI_PREWRITE_ENFORCEMENT';

export type ExperimentalFeatureResolution = {
  feature: ExperimentalFeatureId;
  layer: ExperimentalFeatureLayer;
  mode: ExperimentalFeatureMode;
  source: ExperimentalFeatureSource;
  blocking: boolean;
  activationVariable: ExperimentalFeatureActivationVariable;
  legacyActivationVariable: ExperimentalFeatureLegacyActivationVariable | null;
};

type ExperimentalFeatureConfig = {
  defaultMode: ExperimentalFeatureMode;
  activationVariable: ExperimentalFeatureActivationVariable;
  legacyActivationVariable: ExperimentalFeatureLegacyActivationVariable | null;
};

const EXPERIMENTAL_FEATURES: Record<ExperimentalFeatureId, ExperimentalFeatureConfig> = {
  pre_write: {
    defaultMode: 'strict',
    activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
    legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
  },
  sdd: {
    defaultMode: 'off',
    activationVariable: 'PUMUKI_EXPERIMENTAL_SDD',
    legacyActivationVariable: null,
  },
  heuristics: {
    defaultMode: 'off',
    activationVariable: 'PUMUKI_EXPERIMENTAL_HEURISTICS',
    legacyActivationVariable: null,
  },
  mcp_enterprise: {
    defaultMode: 'strict',
    activationVariable: 'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE',
    legacyActivationVariable: null,
  },
  learning_context: {
    defaultMode: 'off',
    activationVariable: 'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT',
    legacyActivationVariable: null,
  },
  analytics: {
    defaultMode: 'off',
    activationVariable: 'PUMUKI_EXPERIMENTAL_ANALYTICS',
    legacyActivationVariable: null,
  },
  operational_memory: {
    defaultMode: 'off',
    activationVariable: 'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY',
    legacyActivationVariable: null,
  },
  saas_ingestion: {
    defaultMode: 'off',
    activationVariable: 'PUMUKI_EXPERIMENTAL_SAAS_INGESTION',
    legacyActivationVariable: null,
  },
};

const toExperimentalFeatureMode = (
  value: string | undefined
): ExperimentalFeatureMode | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'strict') {
    return 'strict';
  }
  if (
    normalized === 'advisory'
    || normalized === 'warn'
    || normalized === 'warning'
  ) {
    return 'advisory';
  }
  if (
    normalized === 'off'
    || normalized === '0'
    || normalized === 'false'
    || normalized === 'no'
    || normalized === 'disabled'
  ) {
    return 'off';
  }
  return null;
};

export const resolveExperimentalFeature = (
  feature: ExperimentalFeatureId
): ExperimentalFeatureResolution => {
  const config = EXPERIMENTAL_FEATURES[feature];
  const modeFromEnv = toExperimentalFeatureMode(
    process.env[config.activationVariable]
  );
  if (modeFromEnv) {
    return {
      feature,
      layer: 'experimental',
      mode: modeFromEnv,
      source: 'env',
      blocking: modeFromEnv === 'strict',
      activationVariable: config.activationVariable,
      legacyActivationVariable: config.legacyActivationVariable,
    };
  }

  const legacyValue = config.legacyActivationVariable
    ? process.env[config.legacyActivationVariable]
    : undefined;
  const modeFromLegacyEnv = toExperimentalFeatureMode(legacyValue);
  if (modeFromLegacyEnv) {
    return {
      feature,
      layer: 'experimental',
      mode: modeFromLegacyEnv,
      source: 'legacy-env',
      blocking: modeFromLegacyEnv === 'strict',
      activationVariable: config.activationVariable,
      legacyActivationVariable: config.legacyActivationVariable,
    };
  }

  return {
    feature,
    layer: 'experimental',
    mode: config.defaultMode,
    source: 'default',
    blocking: config.defaultMode === 'strict',
    activationVariable: config.activationVariable,
    legacyActivationVariable: config.legacyActivationVariable,
  };
};

export const resolvePreWriteExperimentalFeature = (): ExperimentalFeatureResolution => {
  return resolveExperimentalFeature('pre_write');
};

export const resolveSddExperimentalFeature = (): ExperimentalFeatureResolution => {
  return resolveExperimentalFeature('sdd');
};

export const resolveHeuristicsExperimentalFeature = (): ExperimentalFeatureResolution => {
  return resolveExperimentalFeature('heuristics');
};

export const resolveMcpEnterpriseExperimentalFeature = (): ExperimentalFeatureResolution => {
  return resolveExperimentalFeature('mcp_enterprise');
};

export const resolveLearningContextExperimentalFeature = (): ExperimentalFeatureResolution => {
  return resolveExperimentalFeature('learning_context');
};

export const resolveAnalyticsExperimentalFeature = (): ExperimentalFeatureResolution => {
  return resolveExperimentalFeature('analytics');
};

export const resolveOperationalMemoryExperimentalFeature = (): ExperimentalFeatureResolution => {
  return resolveExperimentalFeature('operational_memory');
};

export const resolveSaasIngestionExperimentalFeature = (): ExperimentalFeatureResolution => {
  return resolveExperimentalFeature('saas_ingestion');
};
