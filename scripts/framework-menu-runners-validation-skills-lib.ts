import { buildSkillsLockCheckCommandArgs } from './framework-menu-builders';
import {
  getExitCode,
  resolveScriptOrReportMissing,
  runNpx,
} from './framework-menu-runner-common';

export const runSkillsLockCheck = async (): Promise<number> => {
  try {
    const scriptPath = resolveScriptOrReportMissing('scripts/compile-skills-lock.ts');
    if (!scriptPath) {
      return 1;
    }
    runNpx(buildSkillsLockCheckCommandArgs({ scriptPath }));
    return 0;
  } catch (error) {
    return getExitCode(error);
  }
};
