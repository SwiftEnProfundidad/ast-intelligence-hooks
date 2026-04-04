import { buildAdapterRealSessionReportCommandArgs } from './framework-menu-builders';
import type { AdapterRealSessionRunnerParams } from './framework-menu-runners-adapter-contract';
import {
  getExitCode,
  resolveScriptOrReportMissing,
  runNpx,
} from './framework-menu-runner-common';

type AdapterRealSessionRunnerDeps = {
  resolveScriptOrReportMissing: typeof resolveScriptOrReportMissing;
  runNpx: typeof runNpx;
  getExitCode: typeof getExitCode;
};

const defaultDeps: AdapterRealSessionRunnerDeps = {
  resolveScriptOrReportMissing,
  runNpx,
  getExitCode,
};

export const runAdapterRealSessionReport = async (
  params: AdapterRealSessionRunnerParams,
  deps: AdapterRealSessionRunnerDeps = defaultDeps
): Promise<number> => {
  const scriptPath = deps.resolveScriptOrReportMissing('scripts/build-adapter-real-session-report.ts');
  if (!scriptPath) {
    return 0;
  }

  try {
    deps.runNpx(
      buildAdapterRealSessionReportCommandArgs({
        scriptPath,
        statusReportFile: params.statusReportFile,
        outFile: params.outFile,
      })
    );

    return 0;
  } catch (error) {
    return deps.getExitCode(error);
  }
};
