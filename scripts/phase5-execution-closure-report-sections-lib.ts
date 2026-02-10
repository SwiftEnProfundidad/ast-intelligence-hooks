import type {
  Phase5ExecutionClosureExecution,
  Phase5ExecutionClosureRunReportParams,
} from './phase5-execution-closure-report-contract';
import { appendPhase5ExecutionClosureCommandPlanLines, appendPhase5ExecutionClosureExecutionTableLines } from './phase5-execution-closure-report-executions-lib';
import { appendPhase5ExecutionClosureReportHeaderLines } from './phase5-execution-closure-report-header-lib';
import { appendPhase5ExecutionClosureNextActionLines } from './phase5-execution-closure-report-next-actions-lib';

type RequiredFailure = Phase5ExecutionClosureExecution;

export const appendPhase5ExecutionClosureReportHeader = (
  lines: string[],
  params: Phase5ExecutionClosureRunReportParams,
  requiredFailures: ReadonlyArray<RequiredFailure>
): void => {
  appendPhase5ExecutionClosureReportHeaderLines({
    lines,
    source: params,
    hasRequiredFailures: requiredFailures.length > 0,
  });
};

export const appendPhase5ExecutionClosureExecutionTable = (
  lines: string[],
  executions: ReadonlyArray<Phase5ExecutionClosureExecution>
): void => {
  appendPhase5ExecutionClosureExecutionTableLines({
    lines,
    executions,
  });
};

export const appendPhase5ExecutionClosureCommandPlan = (
  lines: string[],
  params: Phase5ExecutionClosureRunReportParams
): void => {
  appendPhase5ExecutionClosureCommandPlanLines({
    lines,
    source: params,
  });
};

export const appendPhase5ExecutionClosureNextActions = (
  lines: string[],
  requiredFailures: ReadonlyArray<RequiredFailure>
): void => {
  appendPhase5ExecutionClosureNextActionLines({
    lines,
    requiredFailures,
  });
};
