import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureExecution,
} from './phase5-execution-closure-lib';
import { executePhase5ExecutionClosureCommand } from './phase5-execution-closure-runner-exec-command-lib';
import {
  printPhase5ExecutionClosureFailureNotice,
  resolvePhase5ExecutionClosureCommandFailure,
  shouldStopPhase5ExecutionClosureAfterFailure,
} from './phase5-execution-closure-runner-exec-error-lib';

export const executePhase5ExecutionClosureCommands = (
  commands: ReadonlyArray<Phase5ExecutionClosureCommand>
): ReadonlyArray<Phase5ExecutionClosureExecution> => {
  const executions: Phase5ExecutionClosureExecution[] = [];

  for (const command of commands) {
    try {
      executions.push(executePhase5ExecutionClosureCommand(command));
    } catch (error) {
      executions.push(
        resolvePhase5ExecutionClosureCommandFailure({
          command,
          error,
        })
      );
      printPhase5ExecutionClosureFailureNotice(command);
      if (shouldStopPhase5ExecutionClosureAfterFailure(command)) {
        break;
      }
    }
  }

  return executions;
};
