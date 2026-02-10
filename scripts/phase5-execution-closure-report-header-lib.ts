import type {
  Phase5ExecutionClosureExecution,
  Phase5ExecutionClosureRunReportParams,
} from './phase5-execution-closure-report-contract';

export const appendPhase5ExecutionClosureReportHeaderLines = (params: {
  lines: string[];
  source: Phase5ExecutionClosureRunReportParams;
  hasRequiredFailures: boolean;
}): void => {
  params.lines.push('# Phase 5 Execution Closure Run Report');
  params.lines.push('');
  params.lines.push(`- generated_at: ${params.source.generatedAt}`);
  params.lines.push(`- target_repo: \`${params.source.repo}\``);
  params.lines.push(`- out_dir: \`${params.source.options.outDir}\``);
  params.lines.push(`- include_adapter: ${params.source.options.includeAdapter ? 'YES' : 'NO'}`);
  params.lines.push(
    `- include_auth_preflight: ${params.source.options.includeAuthPreflight ? 'YES' : 'NO'}`
  );
  params.lines.push(
    `- use_mock_consumer_triage: ${params.source.options.useMockConsumerTriage ? 'YES' : 'NO'}`
  );
  params.lines.push(
    `- require_adapter_readiness: ${params.source.options.requireAdapterReadiness ? 'YES' : 'NO'}`
  );
  params.lines.push(`- run_workflow_lint: ${params.source.options.runWorkflowLint ? 'YES' : 'NO'}`);
  params.lines.push(`- repo_path_provided: ${params.source.options.repoPathProvided ? 'YES' : 'NO'}`);
  params.lines.push(
    `- actionlint_bin_provided: ${params.source.options.actionlintBinProvided ? 'YES' : 'NO'}`
  );
  params.lines.push(`- verdict: ${params.hasRequiredFailures ? 'BLOCKED' : 'READY'}`);
  params.lines.push('');
};

export const listPhase5RequiredFailures = (
  executions: ReadonlyArray<Phase5ExecutionClosureExecution>
): ReadonlyArray<Phase5ExecutionClosureExecution> =>
  executions.filter((entry) => entry.command.required && !entry.ok);
