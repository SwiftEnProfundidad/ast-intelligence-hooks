import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';
import { createFrameworkMenuDiagnosticsAdapterActions } from './framework-menu-actions-diagnostics-adapter-lib';
import { createFrameworkMenuDiagnosticsCiActions } from './framework-menu-actions-diagnostics-ci-lib';
import { createFrameworkMenuDiagnosticsMaintenanceActions } from './framework-menu-actions-diagnostics-maintenance-lib';
import { createFrameworkMenuDiagnosticsSupportActions } from './framework-menu-actions-diagnostics-support-lib';

export const createFrameworkMenuDiagnosticsActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    ...createFrameworkMenuDiagnosticsAdapterActions(params),
    ...createFrameworkMenuDiagnosticsCiActions(params),
    ...createFrameworkMenuDiagnosticsSupportActions(params),
    ...createFrameworkMenuDiagnosticsMaintenanceActions(params),
  ];
};
