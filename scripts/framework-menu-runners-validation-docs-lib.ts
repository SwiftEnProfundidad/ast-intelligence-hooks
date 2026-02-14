import { buildValidationDocsHygieneCommandArgs } from './framework-menu-builders';
import {
  getExitCode,
  resolveScriptOrReportMissing,
  runNpx,
} from './framework-menu-runner-common';

export const runValidationDocsHygiene = async (): Promise<number> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/check-validation-docs-hygiene.ts');
  if (!scriptPath) {
    return 1;
  }

  try {
    runNpx(buildValidationDocsHygieneCommandArgs({ scriptPath }));
    return 0;
  } catch (error) {
    return getExitCode(error);
  }
};
