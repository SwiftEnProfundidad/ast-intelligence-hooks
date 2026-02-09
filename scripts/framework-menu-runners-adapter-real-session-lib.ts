import { buildAdapterRealSessionReportCommandArgs } from './framework-menu-builders';
import type { AdapterRealSessionRunnerParams } from './framework-menu-runners-adapter-contract';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runAdapterRealSessionReport = async (
  params: AdapterRealSessionRunnerParams
): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-adapter-real-session-report.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildAdapterRealSessionReportCommandArgs({
      scriptPath,
      statusReportFile: params.statusReportFile,
      outFile: params.outFile,
    })
  );
};
