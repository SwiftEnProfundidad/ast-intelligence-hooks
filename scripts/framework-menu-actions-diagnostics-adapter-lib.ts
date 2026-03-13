import {
  runAdapterRealSessionReport,
  runAdapterSessionStatusReport,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';
import { runAndPrintExitCode } from './framework-menu-runner-common';

type FrameworkMenuDiagnosticsAdapterActionDeps = {
  runAdapterSessionStatusReport: typeof runAdapterSessionStatusReport;
  runAdapterRealSessionReport: typeof runAdapterRealSessionReport;
  runAndPrintExitCode: typeof runAndPrintExitCode;
};

const defaultDeps: FrameworkMenuDiagnosticsAdapterActionDeps = {
  runAdapterSessionStatusReport,
  runAdapterRealSessionReport,
  runAndPrintExitCode,
};

export const createFrameworkMenuDiagnosticsAdapterActions = (
  params: FrameworkMenuActionContext,
  deps: FrameworkMenuDiagnosticsAdapterActionDeps = defaultDeps
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '9',
      label: 'Build adapter session status report (optional diagnostics)',
      execute: async () => {
        const report = await params.prompts.askAdapterSessionStatusReport();
        await deps.runAndPrintExitCode(() => deps.runAdapterSessionStatusReport(report));
      },
    },
    {
      id: '16',
      label: 'Build adapter real-session report (optional diagnostics)',
      execute: async () => {
        const report = await params.prompts.askAdapterRealSessionReport();
        await deps.runAndPrintExitCode(() => deps.runAdapterRealSessionReport(report));
      },
    },
  ];
};
