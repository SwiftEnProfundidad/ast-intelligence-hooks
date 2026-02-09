import type {
  Phase5ExecutionClosureExecution,
  Phase5ExecutionClosureRunReportParams,
} from './phase5-execution-closure-report-contract';

type RequiredFailure = Phase5ExecutionClosureExecution;

export const appendPhase5ExecutionClosureReportHeader = (
  lines: string[],
  params: Phase5ExecutionClosureRunReportParams,
  requiredFailures: ReadonlyArray<RequiredFailure>
): void => {
  lines.push('# Phase 5 Execution Closure Run Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- out_dir: \`${params.options.outDir}\``);
  lines.push(`- include_adapter: ${params.options.includeAdapter ? 'YES' : 'NO'}`);
  lines.push(
    `- include_auth_preflight: ${params.options.includeAuthPreflight ? 'YES' : 'NO'}`
  );
  lines.push(
    `- use_mock_consumer_triage: ${params.options.useMockConsumerTriage ? 'YES' : 'NO'}`
  );
  lines.push(
    `- require_adapter_readiness: ${params.options.requireAdapterReadiness ? 'YES' : 'NO'}`
  );
  lines.push(`- run_workflow_lint: ${params.options.runWorkflowLint ? 'YES' : 'NO'}`);
  lines.push(`- repo_path_provided: ${params.options.repoPathProvided ? 'YES' : 'NO'}`);
  lines.push(
    `- actionlint_bin_provided: ${params.options.actionlintBinProvided ? 'YES' : 'NO'}`
  );
  lines.push(`- verdict: ${requiredFailures.length === 0 ? 'READY' : 'BLOCKED'}`);
  lines.push('');
};

export const appendPhase5ExecutionClosureExecutionTable = (
  lines: string[],
  executions: ReadonlyArray<Phase5ExecutionClosureExecution>
): void => {
  lines.push('## Executions');
  lines.push('');
  lines.push('| id | required | exit_code | status | outputs |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const execution of executions) {
    lines.push(
      `| ${execution.command.id} | ${execution.command.required ? 'yes' : 'no'} | ${execution.exitCode} | ${execution.ok ? 'ok' : 'failed'} | ${execution.command.outputFiles.map((file) => `\`${file}\``).join(', ')} |`
    );
  }
  lines.push('');
};

export const appendPhase5ExecutionClosureCommandPlan = (
  lines: string[],
  params: Phase5ExecutionClosureRunReportParams
): void => {
  lines.push('## Command Plan');
  lines.push('');
  for (const command of params.commands) {
    lines.push(`- ${command.id}: ${command.description}`);
    lines.push(
      `  - run: \`npx --yes tsx@4.21.0 ${command.script} ${command.args.join(' ')}\``
    );
  }
  lines.push('');
};

export const appendPhase5ExecutionClosureNextActions = (
  lines: string[],
  requiredFailures: ReadonlyArray<RequiredFailure>
): void => {
  lines.push('## Next Actions');
  lines.push('');
  if (requiredFailures.length === 0) {
    lines.push('- Closure run completed. Review generated reports and attach artifact links.');
  } else {
    for (const failure of requiredFailures) {
      lines.push(
        `- Resolve failed required step \`${failure.command.id}\` and rerun this command.`
      );
    }
  }
  lines.push('');
};
