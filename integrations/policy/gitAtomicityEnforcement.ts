export type GitAtomicityEnforcementMode = 'advisory' | 'strict';

export type GitAtomicityEnforcementResolution = {
  mode: GitAtomicityEnforcementMode;
  source: 'default' | 'env';
  blocking: boolean;
};

const GIT_ATOMICITY_ENFORCEMENT_ENV = 'PUMUKI_GIT_ATOMICITY_ENFORCEMENT';

const toGitAtomicityEnforcementMode = (
  value: string | undefined
): GitAtomicityEnforcementMode | null => {
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

export const resolveGitAtomicityEnforcement = (): GitAtomicityEnforcementResolution => {
  const modeFromEnv = toGitAtomicityEnforcementMode(
    process.env[GIT_ATOMICITY_ENFORCEMENT_ENV]
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
