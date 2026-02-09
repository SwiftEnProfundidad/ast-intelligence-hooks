import {
  buildPhase5BlockersReadinessCommandArgs,
  buildPhase5ExecutionClosureStatusCommandArgs,
  buildPhase5ExternalHandoffCommandArgs,
} from './framework-menu-builders';
import type {
  Phase5BlockersReadinessRunnerParams,
  Phase5ExecutionClosureStatusRunnerParams,
  Phase5ExternalHandoffRunnerParams,
} from './framework-menu-runners-phase5-contract';
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
