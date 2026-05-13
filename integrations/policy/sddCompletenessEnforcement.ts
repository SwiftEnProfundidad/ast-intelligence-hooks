export type SddCompletenessEnforcementMode = 'advisory' | 'strict';

export type SddCompletenessEnforcementResolution = {
  mode: SddCompletenessEnforcementMode;
  source: 'default' | 'env';
  blocking: boolean;
};

const SDD_COMPLETENESS_ENFORCEMENT_ENV = 'PUMUKI_SDD_ENFORCE_COMPLETENESS';

const toSddCompletenessEnforcementMode = (
  value: string | undefined
): SddCompletenessEnforcementMode | null => {
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

export const resolveSddCompletenessEnforcement = (): SddCompletenessEnforcementResolution => {
  const modeFromEnv = toSddCompletenessEnforcementMode(
    process.env[SDD_COMPLETENESS_ENFORCEMENT_ENV]
  );
  if (modeFromEnv) {
    return {
      mode: modeFromEnv,
      source: 'env',
      blocking: modeFromEnv === 'strict',
    };
  }
  return {
    mode: 'advisory',
    source: 'default',
    blocking: false,
  };
};
