import {
  runConsumerCiArtifactsScan,
  runConsumerCiAuthCheck,
  runConsumerWorkflowLintScan,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuDiagnosticsCiActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '10',
      label: 'Collect consumer CI artifacts report',
      execute: async () => {
        const scan = await params.prompts.askConsumerCiScan();
        await runConsumerCiArtifactsScan(scan);
      },
    },
    {
      id: '11',
      label: 'Run consumer CI auth check report',
      execute: async () => {
        const check = await params.prompts.askConsumerCiAuthCheck();
        await runConsumerCiAuthCheck(check);
      },
    },
    {
      id: '12',
      label: 'Run consumer workflow lint report',
      execute: async () => {
        const lint = await params.prompts.askConsumerWorkflowLint();
        await runConsumerWorkflowLintScan(lint);
      },
    },
  ];
};
