import {
  resolvePreWriteExperimentalFeature,
  type ExperimentalFeatureMode,
  type ExperimentalFeatureResolution,
  type ExperimentalFeatureSource,
} from './experimentalFeatures';

export type PreWriteEnforcementMode = ExperimentalFeatureMode;

export type PreWriteEnforcementResolution = {
  mode: PreWriteEnforcementMode;
  source: ExperimentalFeatureSource;
  blocking: boolean;
  layer: ExperimentalFeatureResolution['layer'];
  activationVariable: ExperimentalFeatureResolution['activationVariable'];
  legacyActivationVariable: ExperimentalFeatureResolution['legacyActivationVariable'];
};

export const resolvePreWriteEnforcement = (): PreWriteEnforcementResolution => {
  const experimentalFeature = resolvePreWriteExperimentalFeature();
  return {
    mode: experimentalFeature.mode,
    source: experimentalFeature.source,
    blocking: experimentalFeature.mode !== 'off',
    layer: experimentalFeature.layer,
    activationVariable: experimentalFeature.activationVariable,
    legacyActivationVariable: experimentalFeature.legacyActivationVariable,
  };
};
