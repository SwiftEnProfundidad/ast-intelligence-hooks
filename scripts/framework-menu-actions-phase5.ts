import {
  runAdapterReadiness,
  runAndPrintExitCode,
  runPhase5BlockersReadiness,
  runPhase5ExecutionClosure,
  runPhase5ExecutionClosureStatus,
  runPhase5ExternalHandoff,
  runValidationArtifactsCleanup,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuPhase5Actions = (
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
      id: '24',
      label: 'Run phase5 execution closure (one-shot orchestration)',
      execute: async () => {
        const runParams = await params.prompts.askPhase5ExecutionClosure();
        await runPhase5ExecutionClosure(runParams);
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
    {
      id: '26',
      label: 'Clean local validation artifacts',
      execute: async () => {
        const cleanParams = await params.prompts.askValidationArtifactsCleanup();
        await runAndPrintExitCode(() => runValidationArtifactsCleanup(cleanParams));
      },
    },
    {
      id: '27',
      label: 'Exit',
      execute: async () => {},
    },
  ];
};
