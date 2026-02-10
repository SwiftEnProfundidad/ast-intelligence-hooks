import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleRunDiagnostic,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
import { createConsumerSupportBundleMarkdownContext } from './consumer-support-bundle-markdown-context-lib';
import { appendConsumerSupportBundleMarkdownSections } from './consumer-support-bundle-markdown-sections-append-lib';

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
  const context = createConsumerSupportBundleMarkdownContext({
    runs: params.runs,
  });
  const lines: string[] = [];
  appendConsumerSupportBundleMarkdownSections({
    lines,
    generatedAtIso: params.generatedAtIso,
    options: params.options,
    authStatus: params.authStatus,
    repoInfo: params.repoInfo,
    actionsPermissions: params.actionsPermissions,
    actionsPermissionsError: params.actionsPermissionsError,
    billingInfo: params.billingInfo,
    billingError: params.billingError,
    runs: params.runs,
    diagnostics: params.diagnostics,
    context,
  });

  return `${lines.join('\n')}\n`;
};
