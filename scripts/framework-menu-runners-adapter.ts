import {
  buildAdapterReadinessCommandArgs,
  buildAdapterRealSessionReportCommandArgs,
} from './framework-menu-builders';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runAdapterSessionStatusReport = async (params: {
  outFile: string;
}): Promise<void> => {
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

export const runAdapterRealSessionReport = async (params: {
  statusReportFile: string;
  outFile: string;
}): Promise<void> => {
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

export const runAdapterReadiness = async (params: {
  adapterReportFile: string;
  outFile: string;
}): Promise<void> => {
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
