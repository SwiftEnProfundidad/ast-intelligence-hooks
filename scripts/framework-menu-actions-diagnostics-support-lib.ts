import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';
import { createFrameworkMenuDiagnosticsSupportCoreActions } from './framework-menu-actions-diagnostics-support-core-lib';
import { createFrameworkMenuDiagnosticsSupportTriageActions } from './framework-menu-actions-diagnostics-support-triage-lib';

export const createFrameworkMenuDiagnosticsSupportActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    ...createFrameworkMenuDiagnosticsSupportCoreActions(params),
    ...createFrameworkMenuDiagnosticsSupportTriageActions(params),
  ];
};
