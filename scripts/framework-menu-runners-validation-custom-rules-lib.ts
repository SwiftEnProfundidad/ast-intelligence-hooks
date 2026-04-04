import { buildImportCustomSkillsCommandArgs } from './framework-menu-builders';
import {
  getExitCode,
  resolveScriptOrReportMissing,
  runNpx,
} from './framework-menu-runner-common';

export const runImportCustomSkills = async (): Promise<number> => {
  try {
    const scriptPath = resolveScriptOrReportMissing('scripts/import-custom-skills.ts');
    if (!scriptPath) {
      return 1;
    }
    runNpx(buildImportCustomSkillsCommandArgs({ scriptPath }));
    return 0;
  } catch (error) {
    return getExitCode(error);
  }
};
