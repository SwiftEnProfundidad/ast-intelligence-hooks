import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runPhase5MenuScript = (params: {
  relativeScriptPath: string;
  args: string[];
}): void => {
  const scriptPath = resolveScriptOrReportMissing(params.relativeScriptPath);
  if (!scriptPath) {
    return;
  }

  runNpx(['--yes', 'tsx@4.21.0', scriptPath, ...params.args]);
};

export const runPhase5BuiltCommand = (params: {
  relativeScriptPath: string;
  buildArgs: (scriptPath: string) => string[];
}): void => {
  const scriptPath = resolveScriptOrReportMissing(params.relativeScriptPath);
  if (!scriptPath) {
    return;
  }

  runNpx(params.buildArgs(scriptPath));
};
