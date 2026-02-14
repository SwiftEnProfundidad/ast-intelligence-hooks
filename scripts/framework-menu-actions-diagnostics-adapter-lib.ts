import {
  runAdapterRealSessionReport,
  runAdapterSessionStatusReport,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuDiagnosticsAdapterActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '9',
      label: 'Build adapter session status report (optional diagnostics)',
      execute: async () => {
        const report = await params.prompts.askAdapterSessionStatusReport();
        await runAdapterSessionStatusReport(report);
      },
    },
    {
      id: '16',
      label: 'Build adapter real-session report (optional diagnostics)',
      execute: async () => {
        const report = await params.prompts.askAdapterRealSessionReport();
        await runAdapterRealSessionReport(report);
      },
    },
  ];
};
