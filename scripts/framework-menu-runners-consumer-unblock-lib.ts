import type { ConsumerStartupUnblockStatusParams } from './framework-menu-runners-consumer-contract';
import { runConsumerMenuScript } from './framework-menu-runners-consumer-exec-lib';

export const runConsumerStartupUnblockStatus = async (
  params: ConsumerStartupUnblockStatusParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/build-consumer-startup-unblock-status.ts',
    args: [
      '--repo',
      params.repo,
      '--support-bundle',
      params.supportBundleFile,
      '--auth-report',
      params.authReportFile,
      '--workflow-lint-report',
      params.workflowLintReportFile,
      '--out',
      params.outFile,
    ],
  });
};
