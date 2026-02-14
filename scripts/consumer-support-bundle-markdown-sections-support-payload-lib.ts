import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';

export const buildSupportPayloadSectionLines = (params: {
  options: ConsumerSupportBundleCliOptions;
  repoInfo?: ConsumerSupportBundleRepoResponse;
  actionsPermissions?: ConsumerSupportBundleRepoActionsPermissionsResponse;
  billingInfo?: ConsumerSupportBundleUserActionsBillingResponse;
  billingError?: string;
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  startupFailures: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  startupStalledRuns: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  oldestQueuedRunAgeMinutes?: number;
  sampleRuns: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
}): string[] => {
  const lines: string[] = [];
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
  lines.push(`startup_failure runs: ${params.startupFailures.length}`);
  lines.push(`startup_stalled runs: ${params.startupStalledRuns.length}`);
  lines.push(`oldest_queued_run_age_minutes: ${params.oldestQueuedRunAgeMinutes ?? 'unknown'}`);
  lines.push('');
  lines.push('Sample run URLs:');
  for (const run of params.sampleRuns) {
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
  return lines;
};
