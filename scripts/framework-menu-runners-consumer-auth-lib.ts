import type { ConsumerCiAuthCheckParams } from './framework-menu-runners-consumer-contract';
import { runConsumerMenuScript } from './framework-menu-runners-consumer-exec-lib';

export const runConsumerCiAuthCheck = async (
  params: ConsumerCiAuthCheckParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/check-consumer-ci-auth.ts',
    args: ['--repo', params.repo, '--out', params.outFile],
  });
};
