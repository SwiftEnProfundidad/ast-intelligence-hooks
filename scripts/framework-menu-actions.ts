import {
  type FrameworkMenuActionContext,
  type MenuAction,
} from './framework-menu-action-contract';
import { createFrameworkMenuDiagnosticsActions } from './framework-menu-actions-diagnostics';
import { createFrameworkMenuGateActions } from './framework-menu-actions-gates';
import { createFrameworkMenuPhase5Actions } from './framework-menu-actions-phase5';

export type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    ...createFrameworkMenuGateActions(params),
    ...createFrameworkMenuDiagnosticsActions(params),
    ...createFrameworkMenuPhase5Actions(params),
  ];
};
