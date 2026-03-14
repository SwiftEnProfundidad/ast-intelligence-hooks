export type SkillsEnforcementMode = 'advisory' | 'strict';

export type SkillsEnforcementResolution = {
  mode: SkillsEnforcementMode;
  source: 'default' | 'env';
  blocking: boolean;
};

const SKILLS_ENFORCEMENT_ENV = 'PUMUKI_SKILLS_ENFORCEMENT';

const toSkillsEnforcementMode = (
  value: string | undefined
): SkillsEnforcementMode | null => {
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

export const resolveSkillsEnforcement = (): SkillsEnforcementResolution => {
  const modeFromEnv = toSkillsEnforcementMode(process.env[SKILLS_ENFORCEMENT_ENV]);
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
