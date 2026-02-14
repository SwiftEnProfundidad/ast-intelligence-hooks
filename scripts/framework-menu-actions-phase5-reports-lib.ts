import {
  runAdapterReadiness,
  runPhase5BlockersReadiness,
  runPhase5ExecutionClosureStatus,
  runPhase5ExternalHandoff,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuPhase5ReportActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '21',
      label: 'Build phase5 blockers readiness report',
      execute: async () => {
        const report = await params.prompts.askPhase5BlockersReadiness();
        await runPhase5BlockersReadiness(report);
      },
    },
    {
      id: '22',
      label: 'Build adapter readiness report',
      execute: async () => {
        const report = await params.prompts.askAdapterReadiness();
        await runAdapterReadiness(report);
      },
    },
    {
      id: '23',
      label: 'Build phase5 execution closure status report',
      execute: async () => {
        const report = await params.prompts.askPhase5ExecutionClosureStatus();
        await runPhase5ExecutionClosureStatus(report);
      },
    },
    {
      id: '25',
      label: 'Build phase5 external handoff report',
      execute: async () => {
        const reportParams = await params.prompts.askPhase5ExternalHandoff();
        await runPhase5ExternalHandoff(reportParams);
      },
    },
  ];
};
