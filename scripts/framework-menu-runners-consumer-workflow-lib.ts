import type { ConsumerWorkflowLintScanParams } from './framework-menu-runners-consumer-contract';
import { runConsumerMenuScript } from './framework-menu-runners-consumer-exec-lib';

export const runConsumerWorkflowLintScan = async (
  params: ConsumerWorkflowLintScanParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/lint-consumer-workflows.ts',
    args: [
      '--repo-path',
      params.repoPath,
      '--actionlint-bin',
      params.actionlintBin,
      '--out',
      params.outFile,
    ],
  });
};
