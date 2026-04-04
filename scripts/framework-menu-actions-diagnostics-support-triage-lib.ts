import { runConsumerStartupTriage, runMockConsumerAbReport } from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuDiagnosticsSupportTriageActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '19',
      label: 'Toolkit: run consumer startup triage bundle',
      execute: async () => {
        const triage = await params.prompts.askConsumerStartupTriage();
        await runConsumerStartupTriage(triage);
      },
    },
    {
      id: '20',
      label: 'Toolkit: build mock consumer A/B validation report',
      execute: async () => {
        const report = await params.prompts.askMockConsumerAbReport();
        await runMockConsumerAbReport(report);
      },
    },
  ];
};
