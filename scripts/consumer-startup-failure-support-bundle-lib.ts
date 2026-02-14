import {
  type ConsumerSupportBundleCliOptions,
} from './consumer-support-bundle-contract';
import { createConsumerSupportBundleDefaultOptions } from './consumer-support-bundle-args-defaults-lib';
import {
  applyConsumerSupportBundleValueArg,
  isConsumerSupportBundleValueArg,
} from './consumer-support-bundle-args-values-lib';
export {
  DEFAULT_CONSUMER_SUPPORT_BUNDLE_LIMIT,
  DEFAULT_CONSUMER_SUPPORT_BUNDLE_OUT_FILE,
  type ConsumerSupportBundleArtifactResponse,
  type ConsumerSupportBundleCliOptions,
  type ConsumerSupportBundleJobsResponse,
  type ConsumerSupportBundleRepoActionsPermissionsResponse,
  type ConsumerSupportBundleRepoResponse,
  type ConsumerSupportBundleRunDiagnostic,
  type ConsumerSupportBundleRunMetadata,
  type ConsumerSupportBundleUserActionsBillingResponse,
  type ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
export { buildConsumerSupportBundleMarkdown } from './consumer-support-bundle-markdown-lib';

export const parseConsumerSupportBundleArgs = (
  args: ReadonlyArray<string>
): ConsumerSupportBundleCliOptions => {
  const options: ConsumerSupportBundleCliOptions = createConsumerSupportBundleDefaultOptions();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (isConsumerSupportBundleValueArg(arg)) {
      const value = args[index + 1];
      if (!value) {
        throw new Error(`Missing value for ${arg}`);
      }
      applyConsumerSupportBundleValueArg({
        options,
        arg,
        value,
      });
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repo) {
    throw new Error('Missing required argument --repo <owner/repo>');
  }

  return options;
};

export const extractRepoOwner = (repo: string): string | undefined => {
  const owner = repo.split('/')[0]?.trim();
  return owner?.length ? owner : undefined;
};
