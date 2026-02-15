import type { Phase5BlockersReadinessCommandParams } from './framework-menu-builders-phase5-contract';
import { buildFrameworkMenuTsxCommandPrefix } from './framework-menu-builders-shared-lib';

export const buildPhase5BlockersReadinessCommandArgs = (
  params: Phase5BlockersReadinessCommandParams
): string[] => {
  return [
    ...buildFrameworkMenuTsxCommandPrefix(params.scriptPath),
    '--adapter-report',
    params.adapterReportFile,
    '--consumer-triage-report',
    params.consumerTriageReportFile,
    '--out',
    params.outFile,
  ];
};
