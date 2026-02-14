import type { ConsumerSupportTicketDraftParams } from './framework-menu-runners-consumer-contract';
import { runConsumerMenuScript } from './framework-menu-runners-consumer-exec-lib';

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
