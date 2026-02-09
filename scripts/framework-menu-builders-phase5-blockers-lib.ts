import type { Phase5BlockersReadinessCommandParams } from './framework-menu-builders-phase5-contract';
import { buildPhase5TsxCommandPrefix } from './framework-menu-builders-phase5-shared-lib';

export const buildPhase5BlockersReadinessCommandArgs = (
  params: Phase5BlockersReadinessCommandParams
): string[] => {
  return [
    ...buildPhase5TsxCommandPrefix(params.scriptPath),
    '--adapter-report',
    params.adapterReportFile,
    '--consumer-triage-report',
    params.consumerTriageReportFile,
    '--out',
    params.outFile,
  ];
};
