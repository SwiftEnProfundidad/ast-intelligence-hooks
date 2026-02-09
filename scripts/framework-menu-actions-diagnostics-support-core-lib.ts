import {
  runConsumerStartupUnblockStatus,
  runConsumerSupportBundle,
  runConsumerSupportTicketDraft,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuDiagnosticsSupportCoreActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '13',
      label: 'Build consumer startup-failure support bundle',
      execute: async () => {
        const bundle = await params.prompts.askConsumerSupportBundle();
        await runConsumerSupportBundle(bundle);
      },
    },
    {
      id: '14',
      label: 'Build consumer support ticket draft',
      execute: async () => {
        const draft = await params.prompts.askConsumerSupportTicketDraft();
        await runConsumerSupportTicketDraft(draft);
      },
    },
    {
      id: '15',
      label: 'Build consumer startup-unblock status report',
      execute: async () => {
        const status = await params.prompts.askConsumerStartupUnblockStatus();
        await runConsumerStartupUnblockStatus(status);
      },
    },
  ];
};
