import { buildFrameworkMenuTsxCommandPrefix } from './framework-menu-builders-shared-lib';

export const buildAdapterRealSessionReportCommandArgs = (params: {
  scriptPath: string;
  statusReportFile: string;
  outFile: string;
}): string[] => {
  return [
    ...buildFrameworkMenuTsxCommandPrefix(params.scriptPath),
    '--status-report',
    params.statusReportFile,
    '--out',
    params.outFile,
  ];
};

export const buildAdapterReadinessCommandArgs = (params: {
  scriptPath: string;
  adapterReportFile: string;
  outFile: string;
}): string[] => {
  return [
    ...buildFrameworkMenuTsxCommandPrefix(params.scriptPath),
    '--adapter-report',
    params.adapterReportFile,
    '--out',
    params.outFile,
  ];
};
