import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageExecution,
} from './consumer-startup-triage-lib';

export const renderConsumerStartupTriageDryRunPlan = (
  commands: ReadonlyArray<ConsumerStartupTriageCommand>
): string => {
  const lines = ['consumer startup triage dry-run plan:'];
  for (const command of commands) {
    lines.push(
      `- ${command.id}: npx --yes tsx@4.21.0 ${command.script} ${command.args.join(' ')}`
    );
  }
  return `${lines.join('\n')}\n`;
};

const resolveExecutionFailureStatus = (error: unknown): number => {
  const status =
    error && typeof error === 'object' && 'status' in error
      ? Number((error as { status?: number }).status ?? 1)
      : 1;
  return Number.isFinite(status) ? status : 1;
};

const resolveExecutionFailureMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : 'unknown command failure';
};

export const executeConsumerStartupTriageCommands = (
  commands: ReadonlyArray<ConsumerStartupTriageCommand>
): ConsumerStartupTriageExecution[] => {
  const executions: ConsumerStartupTriageExecution[] = [];

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
      executions.push({
        command,
        exitCode: resolveExecutionFailureStatus(error),
        ok: false,
        error: resolveExecutionFailureMessage(error),
      });
    }
  }

  return executions;
};
