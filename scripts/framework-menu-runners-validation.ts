import {
  buildCleanValidationArtifactsCommandArgs,
  buildSkillsLockCheckCommandArgs,
  buildValidationDocsHygieneCommandArgs,
} from './framework-menu-builders';
import {
  getExitCode,
  resolveScriptOrReportMissing,
  runNpm,
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

export const runValidationArtifactsCleanup = async (params: {
  dryRun: boolean;
}): Promise<number> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/clean-validation-artifacts.ts');
  if (!scriptPath) {
    return 1;
  }

  try {
    runNpx(
      buildCleanValidationArtifactsCommandArgs({
        scriptPath,
        dryRun: params.dryRun,
      })
    );
    return 0;
  } catch (error) {
    return getExitCode(error);
  }
};

export const runSkillsLockCheck = async (): Promise<number> => {
  try {
    runNpm(buildSkillsLockCheckCommandArgs());
    return 0;
  } catch (error) {
    return getExitCode(error);
  }
};
