import type { AdapterSessionStatusRunnerParams } from './framework-menu-runners-adapter-contract';
import {
  getExitCode,
  resolveScriptOrReportMissing,
  runNpx,
} from './framework-menu-runner-common';

type AdapterSessionStatusRunnerDeps = {
  resolveScriptOrReportMissing: typeof resolveScriptOrReportMissing;
  runNpx: typeof runNpx;
  getExitCode: typeof getExitCode;
};

const defaultDeps: AdapterSessionStatusRunnerDeps = {
  resolveScriptOrReportMissing,
  runNpx,
  getExitCode,
};

export const runAdapterSessionStatusReport = async (
  params: AdapterSessionStatusRunnerParams,
  deps: AdapterSessionStatusRunnerDeps = defaultDeps
): Promise<number> => {
  const scriptPath = deps.resolveScriptOrReportMissing('scripts/build-adapter-session-status.ts');
  if (!scriptPath) {
    return 0;
  }

  try {
    deps.runNpx([
      '--yes',
      'tsx@4.21.0',
      scriptPath,
      '--out',
      params.outFile,
    ]);

    return 0;
  } catch (error) {
    return deps.getExitCode(error);
  }
};
