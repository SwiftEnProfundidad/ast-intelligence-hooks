import type {
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';

export const buildRepositoryActionsPolicySectionLines = (params: {
  actionsPermissions?: ConsumerSupportBundleRepoActionsPermissionsResponse;
  actionsPermissionsError?: string;
}): string[] => {
  const lines: string[] = [];
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
  return lines;
};

export const buildBillingScopeProbeSectionLines = (params: {
  billingInfo?: ConsumerSupportBundleUserActionsBillingResponse;
  billingError?: string;
}): string[] => {
  const lines: string[] = [];
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
  return lines;
};

export const buildRunSummarySectionLines = (params: {
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
}): string[] => {
  const lines: string[] = [];
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
  return lines;
};
