import { execFileSync as runBinarySync } from 'node:child_process';
import type {
  SystemNotificationCommandRunner,
  SystemNotificationCommandRunnerWithOutput,
} from './framework-menu-system-notifications-types';

export const runSystemCommand: SystemNotificationCommandRunner = (command, args) => {
  try {
    runBinarySync(command, [...args], { stdio: 'ignore' });
    return 0;
  } catch {
    return 1;
  }
};

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

export const extractDialogButton = (stdout: string): string | null => {
  const match = stdout.match(/button returned:(.+)/i);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].trim();
};
