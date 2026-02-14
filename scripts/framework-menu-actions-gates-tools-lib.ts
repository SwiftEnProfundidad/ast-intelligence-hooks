import { printEvidence } from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuGateToolsActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '7',
      label: 'Show active skills bundles (version + hash)',
      execute: async () => {
        params.printActiveSkillsBundles();
      },
    },
    {
      id: '8',
      label: 'Read current .ai_evidence.json',
      execute: async () => {
        printEvidence();
      },
    },
  ];
};
