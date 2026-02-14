import type { Phase5ExternalHandoffCommandParams } from './framework-menu-builders-phase5-contract';
import { buildPhase5TsxCommandPrefix } from './framework-menu-builders-phase5-shared-lib';

export const buildPhase5ExternalHandoffCommandArgs = (
  params: Phase5ExternalHandoffCommandParams
): string[] => {
  const args = [
    ...buildPhase5TsxCommandPrefix(params.scriptPath),
    '--repo',
    params.repo,
    '--phase5-status-report',
    params.phase5StatusReportFile,
    '--phase5-blockers-report',
    params.phase5BlockersReportFile,
    '--consumer-unblock-report',
    params.consumerUnblockReportFile,
    '--mock-ab-report',
    params.mockAbReportFile,
    '--run-report',
    params.runReportFile,
    '--out',
    params.outFile,
  ];

  for (const url of params.artifactUrls) {
    args.push('--artifact-url', url);
  }

  if (params.requireArtifactUrls) {
    args.push('--require-artifact-urls');
  }

  if (params.requireMockAbReport) {
    args.push('--require-mock-ab-report');
  }

  return args;
};
