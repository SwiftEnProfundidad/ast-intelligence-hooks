import { execFileSync as runBinarySync } from 'node:child_process';
import type {
  AdapterSessionStatusCommand,
  AdapterSessionStatusCommandExecution,
} from './adapter-session-status-contract';

export const runAdapterSessionStatusCommand = (
  command: AdapterSessionStatusCommand
): AdapterSessionStatusCommandExecution => {
  try {
    const output = runBinarySync('bash', ['-lc', command.command], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return {
      label: command.label,
      command: command.command,
      exitCode: 0,
      output,
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'stdout' in error &&
      'stderr' in error
    ) {
      const status = Number((error as { status?: number }).status ?? 1);
      const stdout = String((error as { stdout?: string | Buffer }).stdout ?? '');
      const stderr = String((error as { stderr?: string | Buffer }).stderr ?? '');

      return {
        label: command.label,
        command: command.command,
        exitCode: Number.isFinite(status) ? status : 1,
        output: `${stdout}${stderr}`.trim(),
      };
    }

    throw error;
  }
};

export const runAdapterSessionStatusCommands = (
  commands: ReadonlyArray<AdapterSessionStatusCommand>
): ReadonlyArray<AdapterSessionStatusCommandExecution> =>
  commands.map((command) => runAdapterSessionStatusCommand(command));
