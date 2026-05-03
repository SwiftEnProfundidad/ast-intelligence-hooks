export type SkillsEnforcementMode = 'advisory' | 'strict';

export type SkillsEnforcementResolution = {
  mode: SkillsEnforcementMode;
  source: 'default' | 'env';
  blocking: boolean;
};

export const resolveSkillsEnforcement = (): SkillsEnforcementResolution => {
  return {
    mode: 'strict',
    source: 'default',
    blocking: true,
  };
};
