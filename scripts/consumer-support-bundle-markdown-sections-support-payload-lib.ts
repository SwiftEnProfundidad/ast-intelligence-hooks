import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';

const resolveSupportPayloadHeadline = (params: {
  repoInfo?: ConsumerSupportBundleRepoResponse;
  startupFailureCount: number;
}): string => {
  const visibility = params.repoInfo?.visibility ?? 'unknown';
  if (params.startupFailureCount > 0) {
    return `Observed GitHub Actions startup_failure runs in ${visibility} repository.`;
  }

  return `No startup_failure runs were observed in the sampled workflow runs for this ${visibility} repository.`;
};

const resolveSupportPayloadPattern = (params: {
  startupFailureCount: number;
  startupStalledCount: number;
}): string => {
  if (params.startupFailureCount > 0) {
    return 'Observed pattern: workflow startup fails before jobs are created (jobs.total_count=0) and artifacts are absent (artifacts.total_count=0).';
  }

  if (params.startupStalledCount > 0) {
    return 'Observed pattern: queued workflow runs remain stalled without reaching a terminal conclusion in the sampled window.';
  }

  return 'Observed pattern: the sampled workflow runs do not show startup_failure conclusions in the attached evidence window.';
};

const resolveSupportPayloadRequest = (params: {
  repoInfo?: ConsumerSupportBundleRepoResponse;
  startupFailureCount: number;
}): string => {
  const visibility = params.repoInfo?.visibility;
  if (params.startupFailureCount > 0 && visibility === 'private') {
    return 'Please verify account/repo-level restrictions for private Actions execution (policy, billing, quotas, or platform controls).';
  }

  if (params.startupFailureCount > 0) {
    return 'Please review the attached diagnostics and identify the exact root cause behind the observed startup_failure runs.';
  }

  return 'Please reconcile the reported issue with the attached diagnostics. The current support bundle does not show startup_failure runs in the sampled evidence window.';
};

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
  lines.push(
    resolveSupportPayloadHeadline({
      repoInfo: params.repoInfo,
      startupFailureCount: params.startupFailures.length,
    })
  );
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
    resolveSupportPayloadPattern({
      startupFailureCount: params.startupFailures.length,
      startupStalledCount: params.startupStalledRuns.length,
    })
  );
  lines.push(
    resolveSupportPayloadRequest({
      repoInfo: params.repoInfo,
      startupFailureCount: params.startupFailures.length,
    })
  );
  lines.push('```');
  lines.push('');
  return lines;
};
