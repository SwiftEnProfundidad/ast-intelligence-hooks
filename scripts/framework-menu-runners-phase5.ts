import {
  buildPhase5BlockersReadinessCommandArgs,
  buildPhase5ExecutionClosureCommandArgs,
  buildPhase5ExecutionClosureStatusCommandArgs,
  buildPhase5ExternalHandoffCommandArgs,
} from './framework-menu-builders';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runPhase5BlockersReadiness = async (params: {
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-phase5-blockers-readiness.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildPhase5BlockersReadinessCommandArgs({
      scriptPath,
      adapterReportFile: params.adapterReportFile,
      consumerTriageReportFile: params.consumerTriageReportFile,
      outFile: params.outFile,
    })
  );
};

export const runPhase5ExecutionClosureStatus = async (params: {
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-phase5-execution-closure-status.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildPhase5ExecutionClosureStatusCommandArgs({
      scriptPath,
      phase5BlockersReportFile: params.phase5BlockersReportFile,
      consumerUnblockReportFile: params.consumerUnblockReportFile,
      adapterReadinessReportFile: params.adapterReadinessReportFile,
      outFile: params.outFile,
      requireAdapterReadiness: params.requireAdapterReadiness,
    })
  );
};

export const runPhase5ExternalHandoff = async (params: {
  repo: string;
  phase5StatusReportFile: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  mockAbReportFile: string;
  runReportFile: string;
  outFile: string;
  artifactUrls: ReadonlyArray<string>;
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-phase5-external-handoff.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
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
    })
  );
};

export const runPhase5ExecutionClosure = async (params: {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
  useMockConsumerTriage: boolean;
}): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/run-phase5-execution-closure.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildPhase5ExecutionClosureCommandArgs({
      scriptPath,
      repo: params.repo,
      limit: params.limit,
      outDir: params.outDir,
      runWorkflowLint: params.runWorkflowLint,
      includeAuthPreflight: params.includeAuthPreflight,
      repoPath: params.repoPath,
      actionlintBin: params.actionlintBin,
      includeAdapter: params.includeAdapter,
      requireAdapterReadiness: params.requireAdapterReadiness,
      useMockConsumerTriage: params.useMockConsumerTriage,
    })
  );
};
