import { execFileSync as runBinarySync } from 'node:child_process';
import type { SystemNotificationCommandRunnerWithOutput } from './framework-menu-system-notifications-types';

export const runSystemCommandWithOutput: SystemNotificationCommandRunnerWithOutput = (
  command,
  args
) => {
  try {
    const stdout = runBinarySync(command, [...args], {
      encoding: 'utf8',
    });
    return {
      exitCode: 0,
      stdout: typeof stdout === 'string' ? stdout : '',
    };
  } catch (error: unknown) {
    const fallbackStdout =
      typeof error === 'object' &&
      error !== null &&
      'stdout' in error &&
      typeof (error as { stdout?: unknown }).stdout === 'string'
        ? (error as { stdout: string }).stdout
        : '';
    return {
      exitCode: 1,
      stdout: fallbackStdout,
    };
  }
};
