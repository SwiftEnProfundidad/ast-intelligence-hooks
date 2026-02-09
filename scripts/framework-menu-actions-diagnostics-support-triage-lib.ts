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
      label: 'Run consumer startup triage bundle',
      execute: async () => {
        const triage = await params.prompts.askConsumerStartupTriage();
        await runConsumerStartupTriage(triage);
      },
    },
    {
      id: '20',
      label: 'Build mock consumer A/B validation report',
      execute: async () => {
        const report = await params.prompts.askMockConsumerAbReport();
        await runMockConsumerAbReport(report);
      },
    },
  ];
};
