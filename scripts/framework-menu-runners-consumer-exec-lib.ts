import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runConsumerMenuScript = (params: {
  relativeScriptPath: string;
  args: string[];
}): void => {
  const scriptPath = resolveScriptOrReportMissing(params.relativeScriptPath);
  if (!scriptPath) {
    return;
  }

  runNpx(['--yes', 'tsx@4.21.0', scriptPath, ...params.args]);
};
