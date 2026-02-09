import { buildMockConsumerAbReportCommandArgs } from './framework-menu-builders';
import type { MockConsumerAbReportParams } from './framework-menu-runners-consumer-contract';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

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
