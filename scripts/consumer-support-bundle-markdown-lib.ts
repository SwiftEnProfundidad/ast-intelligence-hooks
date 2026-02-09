import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleRunDiagnostic,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
import {
  buildBillingScopeProbeSectionLines,
  buildRepositoryActionsPolicySectionLines,
  buildRunDiagnosticsSectionLines,
  buildRunSummarySectionLines,
  buildSupportPayloadSectionLines,
} from './consumer-support-bundle-markdown-sections-lib';

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

  lines.push(
    ...buildRepositoryActionsPolicySectionLines({
      actionsPermissions: params.actionsPermissions,
      actionsPermissionsError: params.actionsPermissionsError,
    })
  );
  lines.push(
    ...buildBillingScopeProbeSectionLines({
      billingInfo: params.billingInfo,
      billingError: params.billingError,
    })
  );
  lines.push(...buildRunSummarySectionLines({ runs: params.runs }));
  lines.push(
    ...buildRunDiagnosticsSectionLines({
      diagnostics: params.diagnostics,
    })
  );
  lines.push(
    ...buildSupportPayloadSectionLines({
      options: params.options,
      repoInfo: params.repoInfo,
      actionsPermissions: params.actionsPermissions,
      billingInfo: params.billingInfo,
      billingError: params.billingError,
      runs: params.runs,
      startupFailures,
      sampleRuns,
    })
  );

  return `${lines.join('\n')}\n`;
};
