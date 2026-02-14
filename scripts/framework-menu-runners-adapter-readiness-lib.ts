import { buildAdapterReadinessCommandArgs } from './framework-menu-builders';
import type { AdapterReadinessRunnerParams } from './framework-menu-runners-adapter-contract';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runAdapterReadiness = async (
  params: AdapterReadinessRunnerParams
): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-adapter-readiness.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildAdapterReadinessCommandArgs({
      scriptPath,
      adapterReportFile: params.adapterReportFile,
      outFile: params.outFile,
    })
  );
};
