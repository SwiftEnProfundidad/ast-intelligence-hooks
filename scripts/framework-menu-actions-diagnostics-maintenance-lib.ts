import {
  runAndPrintExitCode,
  runHardModeEnforcementConfig,
  runSkillsLockCheck,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuDiagnosticsMaintenanceActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '17',
      label: 'Run skills lock freshness check',
      execute: async () => runAndPrintExitCode(runSkillsLockCheck),
    },
    {
      id: '18',
      label: 'Configure hard mode enforcement (enterprise)',
      execute: async () => {
        const profile = await params.prompts.askHardModeProfile();
        await runAndPrintExitCode(() => runHardModeEnforcementConfig({ profile }));
      },
    },
  ];
};
