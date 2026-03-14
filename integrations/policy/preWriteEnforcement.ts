export type PreWriteEnforcementMode = 'advisory' | 'strict';

export type PreWriteEnforcementResolution = {
  mode: PreWriteEnforcementMode;
  source: 'default' | 'env';
  blocking: boolean;
};

const PRE_WRITE_ENFORCEMENT_ENV = 'PUMUKI_PREWRITE_ENFORCEMENT';

const toPreWriteEnforcementMode = (
  value: string | undefined
): PreWriteEnforcementMode | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'strict') {
    return 'strict';
  }
  if (normalized === 'advisory' || normalized === 'warn' || normalized === 'warning') {
    return 'advisory';
  }
  return null;
};

export const resolvePreWriteEnforcement = (): PreWriteEnforcementResolution => {
  const modeFromEnv = toPreWriteEnforcementMode(process.env[PRE_WRITE_ENFORCEMENT_ENV]);
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
