import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleRunDiagnostic,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';

const toMarkdownLiteral = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

export const buildConsumerSupportBundleMarkdown = (params: {
  generatedAtIso: string;
  options: ConsumerSupportBundleCliOptions;
  authStatus: string;
  repoInfo?: ConsumerSupportBundleRepoResponse;
  actionsPermissions?: ConsumerSupportBundleRepoActionsPermissionsResponse;
  actionsPermissionsError?: string;
  billingInfo?: ConsumerSupportBundleUserActionsBillingResponse;
  billingError?: string;
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  diagnostics: ReadonlyArray<ConsumerSupportBundleRunDiagnostic>;
}): string => {
  const startupFailures = params.runs.filter(
    (run) => run.conclusion === 'startup_failure'
  );
  const sampleRuns = startupFailures.slice(0, 3);

  const lines: string[] = [];
  lines.push('# Consumer Startup Failure Support Bundle');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAtIso}`);
  lines.push(`- target_repo: \`${params.options.repo}\``);
  if (params.repoInfo) {
    lines.push(
      `- repo_visibility: \`${params.repoInfo.visibility}\` (private=${String(params.repoInfo.private)})`
    );
  }
  lines.push(`- runs_checked: ${params.runs.length}`);
  lines.push(`- startup_failure_runs: ${startupFailures.length}`);
  lines.push('');

  lines.push('## GH Auth Status');
  lines.push('');
  lines.push('```text');
  lines.push(toMarkdownLiteral(params.authStatus.trimEnd()));
  lines.push('```');
  lines.push('');

  lines.push('## Repository Actions Policy');
  lines.push('');
  if (params.actionsPermissions) {
    lines.push(`- enabled: ${String(params.actionsPermissions.enabled)}`);
    lines.push(`- allowed_actions: ${params.actionsPermissions.allowed_actions}`);
    lines.push(
      `- sha_pinning_required: ${String(params.actionsPermissions.sha_pinning_required)}`
    );
  } else if (params.actionsPermissionsError) {
    lines.push(`- error: ${params.actionsPermissionsError}`);
  } else {
    lines.push('- not available');
  }
  lines.push('');

  lines.push('## Billing Scope Probe');
  lines.push('');
  if (params.billingInfo) {
    lines.push('```json');
    lines.push(JSON.stringify(params.billingInfo, null, 2));
    lines.push('```');
  } else if (params.billingError) {
    lines.push(`- error: ${params.billingError}`);
    lines.push(
      '- remediation: `gh auth refresh -h github.com -s user` and rerun this command.'
    );
  } else {
    lines.push('- not available');
  }
  lines.push('');

  lines.push('## Run Summary');
  lines.push('');
  lines.push('| run_id | workflow | event | branch | status | conclusion | url |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const run of params.runs) {
    lines.push(
      `| ${run.databaseId} | ${run.workflowName || '(empty)'} | ${run.event} | ${run.headBranch} | ${run.status} | ${run.conclusion ?? 'null'} | ${run.url} |`
    );
  }
  lines.push('');

  lines.push('## Run Diagnostics');
  lines.push('');
  for (const diagnostic of params.diagnostics) {
    lines.push(`### Run ${diagnostic.run.databaseId}`);
    lines.push('');
    lines.push(`- url: ${diagnostic.run.url}`);
    lines.push(`- workflowName: ${diagnostic.run.workflowName || '(empty)'}`);
    lines.push(`- event: ${diagnostic.run.event}`);
    lines.push(`- conclusion: ${diagnostic.run.conclusion ?? 'null'}`);
    if (diagnostic.metadata) {
      lines.push(`- path: ${diagnostic.metadata.path}`);
      lines.push(
        `- referenced_workflows: ${diagnostic.metadata.referenced_workflows.length}`
      );
    }
    if (typeof diagnostic.jobsCount === 'number') {
      lines.push(`- jobs.total_count: ${diagnostic.jobsCount}`);
    }
    if (typeof diagnostic.artifactsCount === 'number') {
      lines.push(`- artifacts.total_count: ${diagnostic.artifactsCount}`);
    }
    if (diagnostic.error) {
      lines.push(`- error: ${diagnostic.error}`);
    }
    lines.push('');
  }

  lines.push('## Support Payload (Copy/Paste)');
  lines.push('');
  lines.push('```text');
  lines.push('Persistent GitHub Actions startup_failure in private repository.');
  lines.push('');
  lines.push(`Repository: ${params.options.repo}`);
  if (params.repoInfo) {
    lines.push(`Visibility: ${params.repoInfo.visibility}`);
  }
  if (params.actionsPermissions) {
    lines.push(
      `Repo Actions policy: enabled=${String(params.actionsPermissions.enabled)}, allowed_actions=${params.actionsPermissions.allowed_actions}, sha_pinning_required=${String(params.actionsPermissions.sha_pinning_required)}`
    );
  }
  if (params.billingInfo) {
    lines.push('Billing probe: available (see JSON payload in report).');
  } else if (params.billingError) {
    lines.push(`Billing probe: unavailable (${params.billingError}).`);
  }
  lines.push(`Runs checked: ${params.runs.length}`);
  lines.push(`startup_failure runs: ${startupFailures.length}`);
  lines.push('');
  lines.push('Sample run URLs:');
  for (const run of sampleRuns) {
    lines.push(`- ${run.url}`);
  }
  lines.push('');
  lines.push(
    'Observed pattern: workflow startup fails before jobs are created (jobs.total_count=0) and artifacts are absent (artifacts.total_count=0).'
  );
  lines.push(
    'Please verify account/repo-level restrictions for private Actions execution (policy, billing, quotas, or platform controls).'
  );
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
};
