import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureExecution,
} from './phase5-execution-closure-lib';

export const executePhase5ExecutionClosureCommand = (
  command: Phase5ExecutionClosureCommand
): Phase5ExecutionClosureExecution => {
  const scriptPath = resolve(process.cwd(), command.script);
  execFileSync('npx', ['--yes', 'tsx@4.21.0', scriptPath, ...command.args], {
    stdio: 'inherit',
  });
  return {
    command,
    exitCode: 0,
    ok: true,
  };
};
