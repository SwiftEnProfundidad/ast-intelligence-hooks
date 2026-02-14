import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuPhase5ExitAction = (
  _params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '27',
      label: 'Exit',
      execute: async () => {},
    },
  ];
};
