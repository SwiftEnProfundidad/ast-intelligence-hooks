import { persistSystemNotificationsConfig } from './framework-menu-system-notifications-lib';

export const runSystemNotificationsConfig = async (params: {
  enabled: boolean;
  repoRoot?: string;
}): Promise<number> => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const configPath = persistSystemNotificationsConfig(repoRoot, params.enabled);
  process.stdout.write(
    [
      '',
      '[pumuki] System Notifications Config',
      `- Enabled: ${params.enabled ? 'yes' : 'no'}`,
      `- Persisted config: ${configPath}`,
      '',
    ].join('\n')
  );

  return 0;
};
