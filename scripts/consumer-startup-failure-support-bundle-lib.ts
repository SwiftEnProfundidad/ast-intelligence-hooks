import {
  DEFAULT_CONSUMER_SUPPORT_BUNDLE_LIMIT,
  DEFAULT_CONSUMER_SUPPORT_BUNDLE_OUT_FILE,
  type ConsumerSupportBundleCliOptions,
} from './consumer-support-bundle-contract';
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
  const options: ConsumerSupportBundleCliOptions = {
    repo: '',
    limit: DEFAULT_CONSUMER_SUPPORT_BUNDLE_LIMIT,
    outFile: DEFAULT_CONSUMER_SUPPORT_BUNDLE_OUT_FILE,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }

    if (arg === '--limit') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --limit');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --limit value: ${value}`);
      }
      options.limit = parsed;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
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
