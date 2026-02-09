import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureExecution,
} from './phase5-execution-closure-lib';

export const executePhase5ExecutionClosureCommands = (
  commands: ReadonlyArray<Phase5ExecutionClosureCommand>
): ReadonlyArray<Phase5ExecutionClosureExecution> => {
  const executions: Phase5ExecutionClosureExecution[] = [];

  for (const command of commands) {
    const scriptPath = resolve(process.cwd(), command.script);
    try {
      execFileSync('npx', ['--yes', 'tsx@4.21.0', scriptPath, ...command.args], {
        stdio: 'inherit',
      });
      executions.push({
        command,
        exitCode: 0,
        ok: true,
      });
    } catch (error) {
      const status =
        error && typeof error === 'object' && 'status' in error
          ? Number((error as { status?: number }).status ?? 1)
          : 1;
      executions.push({
        command,
        exitCode: Number.isFinite(status) ? status : 1,
        ok: false,
        error: error instanceof Error ? error.message : 'unknown command failure',
      });

      if (command.id === 'consumer-auth-preflight') {
        process.stdout.write(
          'phase5 execution closure halted: consumer auth preflight failed\n'
        );
        break;
      }
    }
  }

  return executions;
};
