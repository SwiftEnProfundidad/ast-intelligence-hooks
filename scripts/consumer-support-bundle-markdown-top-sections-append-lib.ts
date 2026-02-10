import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
import type { ConsumerSupportBundleMarkdownContext } from './consumer-support-bundle-markdown-context-lib';
import {
  buildBillingScopeProbeSectionLines,
  buildRepositoryActionsPolicySectionLines,
} from './consumer-support-bundle-markdown-sections-lib';
import {
  buildConsumerSupportBundleAuthSectionLines,
  buildConsumerSupportBundleHeaderLines,
} from './consumer-support-bundle-markdown-top-sections-lib';

export const appendConsumerSupportBundleTopSections = (params: {
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
  context: ConsumerSupportBundleMarkdownContext;
}): void => {
  params.lines.push(
    ...buildConsumerSupportBundleHeaderLines({
      generatedAtIso: params.generatedAtIso,
      options: params.options,
      repoInfo: params.repoInfo,
      runs: params.runs,
      startupFailures: params.context.startupFailures,
      startupStalledRuns: params.context.startupStalledRuns,
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
};
