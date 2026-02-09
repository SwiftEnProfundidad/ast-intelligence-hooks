import type {
  ConsumerStartupUnblockStatusParams,
  ConsumerSupportBundleParams,
  ConsumerSupportTicketDraftParams,
} from './framework-menu-runners-consumer-contract';
import { runConsumerMenuScript } from './framework-menu-runners-consumer-exec-lib';

export const runConsumerSupportBundle = async (
  params: ConsumerSupportBundleParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/build-consumer-startup-failure-support-bundle.ts',
    args: ['--repo', params.repo, '--limit', String(params.limit), '--out', params.outFile],
  });
};

export const runConsumerSupportTicketDraft = async (
  params: ConsumerSupportTicketDraftParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/build-consumer-support-ticket-draft.ts',
    args: [
      '--repo',
      params.repo,
      '--support-bundle',
      params.supportBundleFile,
      '--auth-report',
      params.authReportFile,
      '--out',
      params.outFile,
    ],
  });
};

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
