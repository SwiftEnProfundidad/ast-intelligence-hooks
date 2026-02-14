import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';
import { createFrameworkMenuPhase5ExecutionActions } from './framework-menu-actions-phase5-exec-lib';
import { createFrameworkMenuPhase5ExitAction } from './framework-menu-actions-phase5-exit-lib';
import { createFrameworkMenuPhase5ReportActions } from './framework-menu-actions-phase5-reports-lib';

export const createFrameworkMenuPhase5Actions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    ...createFrameworkMenuPhase5ReportActions(params),
    ...createFrameworkMenuPhase5ExecutionActions(params),
    ...createFrameworkMenuPhase5ExitAction(params),
  ];
};
