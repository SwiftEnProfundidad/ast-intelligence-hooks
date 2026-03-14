import {
  runAndPrintExitCode,
  runPhase5ExecutionClosure,
  runValidationArtifactsCleanup,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuPhase5ExecutionActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '24',
      label: 'Toolkit: run phase5 execution closure',
      execute: async () => {
        const runParams = await params.prompts.askPhase5ExecutionClosure();
        await runPhase5ExecutionClosure(runParams);
      },
    },
    {
      id: '26',
      label: 'Toolkit: clean local validation artifacts',
      execute: async () => {
        const cleanParams = await params.prompts.askValidationArtifactsCleanup();
        await runAndPrintExitCode(() => runValidationArtifactsCleanup(cleanParams));
      },
    },
  ];
};
