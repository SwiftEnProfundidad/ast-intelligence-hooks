import type { ConsumerSupportBundleCliOptions } from './consumer-support-bundle-contract';

export type ConsumerSupportBundleValueArg = '--repo' | '--limit' | '--out';

export const isConsumerSupportBundleValueArg = (
  arg: string
): arg is ConsumerSupportBundleValueArg => arg === '--repo' || arg === '--limit' || arg === '--out';

export const applyConsumerSupportBundleValueArg = (params: {
  options: ConsumerSupportBundleCliOptions;
  arg: ConsumerSupportBundleValueArg;
  value: string;
}): void => {
  if (params.arg === '--repo') {
    params.options.repo = params.value;
    return;
  }
  if (params.arg === '--limit') {
    const parsed = Number.parseInt(params.value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Invalid --limit value: ${params.value}`);
    }
    params.options.limit = parsed;
    return;
  }
  params.options.outFile = params.value;
};
