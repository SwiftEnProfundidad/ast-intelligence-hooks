import type { Phase5ExecutionClosureCommand } from './phase5-execution-closure-lib';

export const resolvePhase5ExecutionClosureCommandFailure = (params: {
  command: Phase5ExecutionClosureCommand;
  error: unknown;
}) => {
  const status =
    params.error && typeof params.error === 'object' && 'status' in params.error
      ? Number((params.error as { status?: number }).status ?? 1)
      : 1;

  return {
    command: params.command,
    exitCode: Number.isFinite(status) ? status : 1,
    ok: false as const,
    error:
      params.error instanceof Error ? params.error.message : 'unknown command failure',
  };
};

export const shouldStopPhase5ExecutionClosureAfterFailure = (
  command: Phase5ExecutionClosureCommand
): boolean => command.id === 'consumer-auth-preflight';

export const printPhase5ExecutionClosureFailureNotice = (
  command: Phase5ExecutionClosureCommand
): void => {
  if (!shouldStopPhase5ExecutionClosureAfterFailure(command)) {
    return;
  }
  process.stdout.write('phase5 execution closure halted: consumer auth preflight failed\n');
};
