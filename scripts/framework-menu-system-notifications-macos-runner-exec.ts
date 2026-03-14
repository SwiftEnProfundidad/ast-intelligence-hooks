import { execFileSync as runBinarySync } from 'node:child_process';
import type { SystemNotificationCommandRunner } from './framework-menu-system-notifications-types';

export const runSystemCommand: SystemNotificationCommandRunner = (command, args) => {
  try {
    runBinarySync(command, [...args], { stdio: 'ignore' });
    return 0;
  } catch {
    return 1;
  }
};
