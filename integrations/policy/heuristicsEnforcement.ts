import { resolveHeuristicsExperimentalFeature } from './experimentalFeatures';

export type HeuristicsEnforcementMode = 'advisory' | 'strict';

export type HeuristicsEnforcementResolution = {
  mode: HeuristicsEnforcementMode;
  source: 'default' | 'env' | 'experimental:heuristics';
  blocking: boolean;
};

const HEURISTICS_ENFORCEMENT_ENV = 'PUMUKI_HEURISTICS_ENFORCEMENT';

const toHeuristicsEnforcementMode = (
  value: string | undefined
): HeuristicsEnforcementMode | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (
    normalized === 'strict'
    || normalized === '1'
    || normalized === 'true'
    || normalized === 'yes'
    || normalized === 'on'
  ) {
    return 'strict';
  }
  if (
    normalized === 'advisory'
    || normalized === 'warn'
    || normalized === 'warning'
    || normalized === '0'
    || normalized === 'false'
    || normalized === 'no'
    || normalized === 'off'
  ) {
    return 'advisory';
  }
  return null;
};

export const resolveHeuristicsEnforcement = (): HeuristicsEnforcementResolution => {
  const modeFromEnv = toHeuristicsEnforcementMode(process.env[HEURISTICS_ENFORCEMENT_ENV]);
  if (modeFromEnv) {
    return {
      mode: modeFromEnv,
      source: 'env',
      blocking: modeFromEnv === 'strict',
    };
  }
  const heuristicsFeature = resolveHeuristicsExperimentalFeature();
  if (heuristicsFeature.mode === 'strict' || heuristicsFeature.mode === 'advisory') {
    return {
      mode: heuristicsFeature.mode,
      source: 'experimental:heuristics',
      blocking: heuristicsFeature.mode === 'strict',
    };
  }
  return {
    mode: 'advisory',
    source: 'default',
    blocking: false,
  };
};
