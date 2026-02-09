const tsxCommandPrefix = (scriptPath: string): string[] => {
  return ['--yes', 'tsx@4.21.0', scriptPath];
};

export const buildAdapterRealSessionReportCommandArgs = (params: {
  scriptPath: string;
  statusReportFile: string;
  outFile: string;
}): string[] => {
  return [
    ...tsxCommandPrefix(params.scriptPath),
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
    ...tsxCommandPrefix(params.scriptPath),
    '--adapter-report',
    params.adapterReportFile,
    '--out',
    params.outFile,
  ];
};
