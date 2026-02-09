import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';
import { createFrameworkMenuGateCiActions } from './framework-menu-actions-gates-ci-lib';
import { createFrameworkMenuGateStageActions } from './framework-menu-actions-gates-stage-lib';
import { createFrameworkMenuGateToolsActions } from './framework-menu-actions-gates-tools-lib';

export const createFrameworkMenuGateActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    ...createFrameworkMenuGateStageActions(params),
    ...createFrameworkMenuGateCiActions(params),
    ...createFrameworkMenuGateToolsActions(params),
  ];
};
