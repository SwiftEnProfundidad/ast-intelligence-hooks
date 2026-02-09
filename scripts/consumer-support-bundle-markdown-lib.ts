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
import {
  buildConsumerSupportBundleAuthSectionLines,
  buildConsumerSupportBundleHeaderLines,
} from './consumer-support-bundle-markdown-top-sections-lib';

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
  lines.push(
    ...buildConsumerSupportBundleHeaderLines({
      generatedAtIso: params.generatedAtIso,
      options: params.options,
      repoInfo: params.repoInfo,
      runs: params.runs,
      startupFailures,
    })
  );
  lines.push(...buildConsumerSupportBundleAuthSectionLines(params.authStatus));

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
