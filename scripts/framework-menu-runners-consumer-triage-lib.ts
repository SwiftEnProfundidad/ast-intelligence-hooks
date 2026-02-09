import {
  buildConsumerStartupTriageCommandArgs,
  buildMockConsumerAbReportCommandArgs,
} from './framework-menu-builders';
import type {
  ConsumerStartupTriageParams,
  MockConsumerAbReportParams,
} from './framework-menu-runners-consumer-contract';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runConsumerStartupTriage = async (
  params: ConsumerStartupTriageParams
): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-consumer-startup-triage.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildConsumerStartupTriageCommandArgs({
      scriptPath,
      repo: params.repo,
      limit: params.limit,
      outDir: params.outDir,
      runWorkflowLint: params.runWorkflowLint,
      repoPath: params.repoPath,
      actionlintBin: params.actionlintBin,
    })
  );
};

export const runMockConsumerAbReport = async (
  params: MockConsumerAbReportParams
): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-mock-consumer-ab-report.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildMockConsumerAbReportCommandArgs({
      scriptPath,
      repo: params.repo,
      outFile: params.outFile,
      blockSummaryFile: params.blockSummaryFile,
      minimalSummaryFile: params.minimalSummaryFile,
      blockEvidenceFile: params.blockEvidenceFile,
      minimalEvidenceFile: params.minimalEvidenceFile,
    })
  );
};
