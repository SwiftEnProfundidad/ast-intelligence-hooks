import type { Phase5ExecutionClosureStatusCommandParams } from './framework-menu-builders-phase5-contract';
import { buildFrameworkMenuTsxCommandPrefix } from './framework-menu-builders-shared-lib';

export const buildPhase5ExecutionClosureStatusCommandArgs = (
  params: Phase5ExecutionClosureStatusCommandParams
): string[] => {
  const args = [
    ...buildFrameworkMenuTsxCommandPrefix(params.scriptPath),
    '--phase5-blockers-report',
    params.phase5BlockersReportFile,
    '--consumer-unblock-report',
    params.consumerUnblockReportFile,
    '--adapter-readiness-report',
    params.adapterReadinessReportFile,
    '--out',
    params.outFile,
  ];

  if (params.requireAdapterReadiness) {
    args.push('--require-adapter-readiness');
  }

  return args;
};
