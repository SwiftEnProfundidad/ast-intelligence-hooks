import type {
  Phase5ExecutionClosureExecution,
  Phase5ExecutionClosureRunReportParams,
} from './phase5-execution-closure-report-contract';

export const appendPhase5ExecutionClosureExecutionTableLines = (params: {
  lines: string[];
  executions: ReadonlyArray<Phase5ExecutionClosureExecution>;
}): void => {
  params.lines.push('## Executions');
  params.lines.push('');
  params.lines.push('| id | required | exit_code | status | outputs |');
  params.lines.push('| --- | --- | --- | --- | --- |');
  for (const execution of params.executions) {
    params.lines.push(
      `| ${execution.command.id} | ${execution.command.required ? 'yes' : 'no'} | ${execution.exitCode} | ${execution.ok ? 'ok' : 'failed'} | ${execution.command.outputFiles.map((file) => `\`${file}\``).join(', ')} |`
    );
  }
  params.lines.push('');
};

export const appendPhase5ExecutionClosureCommandPlanLines = (params: {
  lines: string[];
  source: Phase5ExecutionClosureRunReportParams;
}): void => {
  params.lines.push('## Command Plan');
  params.lines.push('');
  for (const command of params.source.commands) {
    params.lines.push(`- ${command.id}: ${command.description}`);
    params.lines.push(
      `  - run: \`npx --yes tsx@4.21.0 ${command.script} ${command.args.join(' ')}\``
    );
  }
  params.lines.push('');
};
