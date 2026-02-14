import type { AdapterSessionStatusRunnerParams } from './framework-menu-runners-adapter-contract';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runAdapterSessionStatusReport = async (
  params: AdapterSessionStatusRunnerParams
): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-adapter-session-status.ts');
  if (!scriptPath) {
    return;
  }

  runNpx([
    '--yes',
    'tsx@4.21.0',
    scriptPath,
    '--out',
    params.outFile,
  ]);
};
