import { buildSkillsLockCheckCommandArgs } from './framework-menu-builders';
import { getExitCode, runNpm } from './framework-menu-runner-common';

export const runSkillsLockCheck = async (): Promise<number> => {
  try {
    runNpm(buildSkillsLockCheckCommandArgs());
    return 0;
  } catch (error) {
    return getExitCode(error);
  }
};
