import { buildCleanValidationArtifactsCommandArgs } from './framework-menu-builders';
import type { ValidationArtifactsCleanupRunnerParams } from './framework-menu-runners-validation-contract';
import {
  getExitCode,
  resolveScriptOrReportMissing,
  runNpx,
} from './framework-menu-runner-common';

export const runValidationArtifactsCleanup = async (
  params: ValidationArtifactsCleanupRunnerParams
): Promise<number> => {
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
