export type SkillsEnforcementResolution = {
  blocking: boolean;
};

export const resolveSkillsEnforcement = (): SkillsEnforcementResolution => {
  return {
    blocking: true,
  };
};
