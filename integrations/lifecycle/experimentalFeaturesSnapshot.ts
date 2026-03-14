import {
  resolveAnalyticsExperimentalFeature,
  resolveHeuristicsExperimentalFeature,
  resolveLearningContextExperimentalFeature,
  resolveMcpEnterpriseExperimentalFeature,
  resolveOperationalMemoryExperimentalFeature,
  resolvePreWriteExperimentalFeature,
  resolveSaasIngestionExperimentalFeature,
  resolveSddExperimentalFeature,
  type ExperimentalFeatureResolution,
} from '../policy/experimentalFeatures';

export type LifecycleExperimentalFeatureSnapshot = {
  layer: ExperimentalFeatureResolution['layer'];
  mode: ExperimentalFeatureResolution['mode'];
  source: ExperimentalFeatureResolution['source'];
  blocking: boolean;
  activationVariable: ExperimentalFeatureResolution['activationVariable'];
  legacyActivationVariable: ExperimentalFeatureResolution['legacyActivationVariable'];
};

export type LifecycleExperimentalFeaturesSnapshot = {
  features: {
    analytics: LifecycleExperimentalFeatureSnapshot;
    heuristics: LifecycleExperimentalFeatureSnapshot;
    learning_context: LifecycleExperimentalFeatureSnapshot;
    mcp_enterprise: LifecycleExperimentalFeatureSnapshot;
    operational_memory: LifecycleExperimentalFeatureSnapshot;
    pre_write: LifecycleExperimentalFeatureSnapshot;
    saas_ingestion: LifecycleExperimentalFeatureSnapshot;
    sdd: LifecycleExperimentalFeatureSnapshot;
  };
};

const toSnapshot = (
  resolution: ExperimentalFeatureResolution
): LifecycleExperimentalFeatureSnapshot => {
  return {
    layer: resolution.layer,
    mode: resolution.mode,
    source: resolution.source,
    blocking: resolution.blocking,
    activationVariable: resolution.activationVariable,
    legacyActivationVariable: resolution.legacyActivationVariable,
  };
};

export const readLifecycleExperimentalFeaturesSnapshot = (): LifecycleExperimentalFeaturesSnapshot => {
  return {
    features: {
      analytics: toSnapshot(resolveAnalyticsExperimentalFeature()),
      heuristics: toSnapshot(resolveHeuristicsExperimentalFeature()),
      learning_context: toSnapshot(resolveLearningContextExperimentalFeature()),
      mcp_enterprise: toSnapshot(resolveMcpEnterpriseExperimentalFeature()),
      operational_memory: toSnapshot(resolveOperationalMemoryExperimentalFeature()),
      pre_write: toSnapshot(resolvePreWriteExperimentalFeature()),
      saas_ingestion: toSnapshot(resolveSaasIngestionExperimentalFeature()),
      sdd: toSnapshot(resolveSddExperimentalFeature()),
    },
  };
};
