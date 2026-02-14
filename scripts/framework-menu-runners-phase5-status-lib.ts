import { buildPhase5ExecutionClosureStatusCommandArgs } from './framework-menu-builders';
import type { Phase5ExecutionClosureStatusRunnerParams } from './framework-menu-runners-phase5-contract';
import { runPhase5BuiltCommand } from './framework-menu-runners-phase5-exec-lib';

export const runPhase5ExecutionClosureStatus = async (
  params: Phase5ExecutionClosureStatusRunnerParams
): Promise<void> => {
  runPhase5BuiltCommand({
    relativeScriptPath: 'scripts/build-phase5-execution-closure-status.ts',
    buildArgs: (scriptPath) =>
      buildPhase5ExecutionClosureStatusCommandArgs({
        scriptPath,
        phase5BlockersReportFile: params.phase5BlockersReportFile,
        consumerUnblockReportFile: params.consumerUnblockReportFile,
        adapterReadinessReportFile: params.adapterReadinessReportFile,
        outFile: params.outFile,
        requireAdapterReadiness: params.requireAdapterReadiness,
      }),
  });
};
