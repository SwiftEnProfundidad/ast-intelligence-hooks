import { buildPhase5BlockersReadinessCommandArgs } from './framework-menu-builders';
import type { Phase5BlockersReadinessRunnerParams } from './framework-menu-runners-phase5-contract';
import { runPhase5BuiltCommand } from './framework-menu-runners-phase5-exec-lib';

export const runPhase5BlockersReadiness = async (
  params: Phase5BlockersReadinessRunnerParams
): Promise<void> => {
  runPhase5BuiltCommand({
    relativeScriptPath: 'scripts/build-phase5-blockers-readiness.ts',
    buildArgs: (scriptPath) =>
      buildPhase5BlockersReadinessCommandArgs({
        scriptPath,
        adapterReportFile: params.adapterReportFile,
        consumerTriageReportFile: params.consumerTriageReportFile,
        outFile: params.outFile,
      }),
  });
};
