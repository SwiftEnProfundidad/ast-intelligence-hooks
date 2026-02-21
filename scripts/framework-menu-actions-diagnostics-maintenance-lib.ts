import {
  runAndPrintExitCode,
  runHardModeEnforcementConfig,
  runRuleCoverageDiagnostics,
  runSystemNotificationsConfig,
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
    {
      id: '31',
      label: 'Configure macOS system notifications',
      execute: async () => {
        const enabled = await params.prompts.askSystemNotificationsEnabled();
        await runAndPrintExitCode(() => runSystemNotificationsConfig({ enabled }));
      },
    },
    {
      id: '32',
      label: 'Run rule coverage diagnostics (repo/stages)',
      execute: async () => runAndPrintExitCode(runRuleCoverageDiagnostics),
    },
  ];
};
