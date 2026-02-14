import type { MockConsumerAbReportCommandParams } from './framework-menu-builders-consumer-contract';
import { buildFrameworkMenuTsxCommandPrefix } from './framework-menu-builders-shared-lib';

export const buildMockConsumerAbReportCommandArgs = (
  params: MockConsumerAbReportCommandParams
): string[] => {
  return [
    ...buildFrameworkMenuTsxCommandPrefix(params.scriptPath),
    '--repo',
    params.repo,
    '--out',
    params.outFile,
    '--block-summary',
    params.blockSummaryFile,
    '--minimal-summary',
    params.minimalSummaryFile,
    '--block-evidence',
    params.blockEvidenceFile,
    '--minimal-evidence',
    params.minimalEvidenceFile,
  ];
};
