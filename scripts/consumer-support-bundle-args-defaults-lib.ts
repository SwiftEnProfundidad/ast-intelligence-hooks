import {
  DEFAULT_CONSUMER_SUPPORT_BUNDLE_LIMIT,
  DEFAULT_CONSUMER_SUPPORT_BUNDLE_OUT_FILE,
  type ConsumerSupportBundleCliOptions,
} from './consumer-support-bundle-contract';

export const createConsumerSupportBundleDefaultOptions = (): ConsumerSupportBundleCliOptions => ({
  repo: '',
  limit: DEFAULT_CONSUMER_SUPPORT_BUNDLE_LIMIT,
  outFile: DEFAULT_CONSUMER_SUPPORT_BUNDLE_OUT_FILE,
});
