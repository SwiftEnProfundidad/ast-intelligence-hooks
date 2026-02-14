import { buildPhase5ExternalHandoffCommandArgs } from './framework-menu-builders';
import type { Phase5ExternalHandoffRunnerParams } from './framework-menu-runners-phase5-contract';
import { runPhase5BuiltCommand } from './framework-menu-runners-phase5-exec-lib';

export const runPhase5ExternalHandoff = async (
  params: Phase5ExternalHandoffRunnerParams
): Promise<void> => {
  runPhase5BuiltCommand({
    relativeScriptPath: 'scripts/build-phase5-external-handoff.ts',
    buildArgs: (scriptPath) =>
      buildPhase5ExternalHandoffCommandArgs({
        scriptPath,
        repo: params.repo,
        phase5StatusReportFile: params.phase5StatusReportFile,
        phase5BlockersReportFile: params.phase5BlockersReportFile,
        consumerUnblockReportFile: params.consumerUnblockReportFile,
        mockAbReportFile: params.mockAbReportFile,
        runReportFile: params.runReportFile,
        outFile: params.outFile,
        artifactUrls: params.artifactUrls,
        requireArtifactUrls: params.requireArtifactUrls,
        requireMockAbReport: params.requireMockAbReport,
      }),
  });
};
