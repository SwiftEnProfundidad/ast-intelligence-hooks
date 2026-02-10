import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleRunDiagnostic,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
import type { ConsumerSupportBundleMarkdownContext } from './consumer-support-bundle-markdown-context-lib';
import { appendConsumerSupportBundleRunSections } from './consumer-support-bundle-markdown-run-sections-append-lib';
import { appendConsumerSupportBundleTopSections } from './consumer-support-bundle-markdown-top-sections-append-lib';

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
  appendConsumerSupportBundleTopSections({
    lines: params.lines,
    generatedAtIso: params.generatedAtIso,
    options: params.options,
    authStatus: params.authStatus,
    repoInfo: params.repoInfo,
    actionsPermissions: params.actionsPermissions,
    actionsPermissionsError: params.actionsPermissionsError,
    billingInfo: params.billingInfo,
    billingError: params.billingError,
    runs: params.runs,
    context: params.context,
  });
  appendConsumerSupportBundleRunSections({
    lines: params.lines,
    options: params.options,
    repoInfo: params.repoInfo,
    actionsPermissions: params.actionsPermissions,
    billingInfo: params.billingInfo,
    billingError: params.billingError,
    runs: params.runs,
    diagnostics: params.diagnostics,
    context: params.context,
  });
};
