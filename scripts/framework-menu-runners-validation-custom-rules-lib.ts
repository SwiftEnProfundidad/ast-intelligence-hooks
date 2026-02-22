import { buildImportCustomSkillsCommandArgs } from './framework-menu-builders';
import { getExitCode, runNpm } from './framework-menu-runner-common';

export const runImportCustomSkills = async (): Promise<number> => {
  try {
    runNpm(buildImportCustomSkillsCommandArgs());
    return 0;
  } catch (error) {
    return getExitCode(error);
  }
};
