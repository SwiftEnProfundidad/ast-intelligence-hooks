import type { ConsumerCiArtifactsScanParams } from './framework-menu-runners-consumer-contract';
import { runConsumerMenuScript } from './framework-menu-runners-consumer-exec-lib';

export const runConsumerCiArtifactsScan = async (
  params: ConsumerCiArtifactsScanParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/collect-consumer-ci-artifacts.ts',
    args: ['--repo', params.repo, '--limit', String(params.limit), '--out', params.outFile],
  });
};
