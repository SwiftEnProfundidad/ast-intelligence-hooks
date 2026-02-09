import type {
  Phase5ExecutionClosureExecution,
  Phase5ExecutionClosureRunReportParams,
} from './phase5-execution-closure-report-contract';
import {
  appendPhase5ExecutionClosureCommandPlan,
  appendPhase5ExecutionClosureExecutionTable,
  appendPhase5ExecutionClosureNextActions,
  appendPhase5ExecutionClosureReportHeader,
} from './phase5-execution-closure-report-sections-lib';

export type { Phase5ExecutionClosureExecution } from './phase5-execution-closure-report-contract';

const listRequiredFailures = (
  executions: ReadonlyArray<Phase5ExecutionClosureExecution>
): ReadonlyArray<Phase5ExecutionClosureExecution> =>
  executions.filter((entry) => entry.command.required && !entry.ok);

export const buildPhase5ExecutionClosureRunReportMarkdown = (
  params: Phase5ExecutionClosureRunReportParams
): string => {
  const lines: string[] = [];
  const requiredFailures = listRequiredFailures(params.executions);

  appendPhase5ExecutionClosureReportHeader(lines, params, requiredFailures);
  appendPhase5ExecutionClosureExecutionTable(lines, params.executions);
  appendPhase5ExecutionClosureCommandPlan(lines, params);
  appendPhase5ExecutionClosureNextActions(lines, requiredFailures);

  return `${lines.join('\n')}\n`;
};
