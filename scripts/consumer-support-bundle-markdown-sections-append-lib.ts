import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleRunDiagnostic,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
import type { ConsumerSupportBundleMarkdownContext } from './consumer-support-bundle-markdown-context-lib';
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

export const appendConsumerSupportBundleMarkdownSections = (params: {
  lines: string[];
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
  context: ConsumerSupportBundleMarkdownContext;
}): void => {
  params.lines.push(
    ...buildConsumerSupportBundleHeaderLines({
      generatedAtIso: params.generatedAtIso,
      options: params.options,
      repoInfo: params.repoInfo,
      runs: params.runs,
      startupFailures: params.context.startupFailures,
    })
  );
  params.lines.push(...buildConsumerSupportBundleAuthSectionLines(params.authStatus));
  params.lines.push(
    ...buildRepositoryActionsPolicySectionLines({
      actionsPermissions: params.actionsPermissions,
      actionsPermissionsError: params.actionsPermissionsError,
    })
  );
  params.lines.push(
    ...buildBillingScopeProbeSectionLines({
      billingInfo: params.billingInfo,
      billingError: params.billingError,
    })
  );
  params.lines.push(...buildRunSummarySectionLines({ runs: params.runs }));
  params.lines.push(
    ...buildRunDiagnosticsSectionLines({
      diagnostics: params.diagnostics,
    })
  );
  params.lines.push(
    ...buildSupportPayloadSectionLines({
      options: params.options,
      repoInfo: params.repoInfo,
      actionsPermissions: params.actionsPermissions,
      billingInfo: params.billingInfo,
      billingError: params.billingError,
      runs: params.runs,
      startupFailures: params.context.startupFailures,
      sampleRuns: params.context.sampleRuns,
    })
  );
};
