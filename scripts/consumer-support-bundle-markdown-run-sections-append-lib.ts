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
  buildRunDiagnosticsSectionLines,
  buildRunSummarySectionLines,
  buildSupportPayloadSectionLines,
} from './consumer-support-bundle-markdown-sections-lib';

export const appendConsumerSupportBundleRunSections = (params: {
  lines: string[];
  options: ConsumerSupportBundleCliOptions;
  repoInfo?: ConsumerSupportBundleRepoResponse;
  actionsPermissions?: ConsumerSupportBundleRepoActionsPermissionsResponse;
  billingInfo?: ConsumerSupportBundleUserActionsBillingResponse;
  billingError?: string;
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  diagnostics: ReadonlyArray<ConsumerSupportBundleRunDiagnostic>;
  context: ConsumerSupportBundleMarkdownContext;
}): void => {
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
      startupStalledRuns: params.context.startupStalledRuns,
      sampleRuns: params.context.sampleRuns,
    })
  );
};
