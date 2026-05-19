export type SkillsEnforcementMode = 'strict';

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
    mode: 'strict',
    source: 'default',
    blocking: true,
  };
};
