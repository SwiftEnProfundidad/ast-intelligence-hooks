import type {
  Phase5ExecutionClosureCommand,
  Phase5ExecutionClosureOptions,
} from './phase5-execution-closure-plan-lib';

export type Phase5ExecutionClosureExecution = {
  command: Phase5ExecutionClosureCommand;
  exitCode: number;
  ok: boolean;
  error?: string;
};

export type Phase5ExecutionClosureRunReportParams = {
  generatedAt: string;
  repo: string;
  options: Omit<
    Phase5ExecutionClosureOptions,
    'repoPath' | 'actionlintBin'
  > & { repoPathProvided: boolean; actionlintBinProvided: boolean };
  commands: ReadonlyArray<Phase5ExecutionClosureCommand>;
  executions: ReadonlyArray<Phase5ExecutionClosureExecution>;
};
