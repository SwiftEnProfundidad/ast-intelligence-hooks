import type { ConsumerSupportBundleParams } from './framework-menu-runners-consumer-contract';
import { runConsumerMenuScript } from './framework-menu-runners-consumer-exec-lib';

export const runConsumerSupportBundle = async (
  params: ConsumerSupportBundleParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/build-consumer-startup-failure-support-bundle.ts',
    args: ['--repo', params.repo, '--limit', String(params.limit), '--out', params.outFile],
  });
};
