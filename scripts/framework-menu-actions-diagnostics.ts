import {
  runAdapterRealSessionReport,
  runAdapterSessionStatusReport,
  runAndPrintExitCode,
  runConsumerCiArtifactsScan,
  runConsumerCiAuthCheck,
  runConsumerStartupTriage,
  runConsumerStartupUnblockStatus,
  runConsumerSupportBundle,
  runConsumerSupportTicketDraft,
  runConsumerWorkflowLintScan,
  runMockConsumerAbReport,
  runSkillsLockCheck,
  runValidationDocsHygiene,
} from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuDiagnosticsActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '9',
      label: 'Build adapter session status report (optional diagnostics)',
      execute: async () => {
        const report = await params.prompts.askAdapterSessionStatusReport();
        await runAdapterSessionStatusReport(report);
      },
    },
    {
      id: '10',
      label: 'Collect consumer CI artifacts report',
      execute: async () => {
        const scan = await params.prompts.askConsumerCiScan();
        await runConsumerCiArtifactsScan(scan);
      },
    },
    {
      id: '11',
      label: 'Run consumer CI auth check report',
      execute: async () => {
        const check = await params.prompts.askConsumerCiAuthCheck();
        await runConsumerCiAuthCheck(check);
      },
    },
    {
      id: '12',
      label: 'Run consumer workflow lint report',
      execute: async () => {
        const lint = await params.prompts.askConsumerWorkflowLint();
        await runConsumerWorkflowLintScan(lint);
      },
    },
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
    {
      id: '16',
      label: 'Build adapter real-session report (optional diagnostics)',
      execute: async () => {
        const report = await params.prompts.askAdapterRealSessionReport();
        await runAdapterRealSessionReport(report);
      },
    },
    {
      id: '17',
      label: 'Run docs/validation hygiene check',
      execute: async () => runAndPrintExitCode(runValidationDocsHygiene),
    },
    {
      id: '18',
      label: 'Run skills lock freshness check',
      execute: async () => runAndPrintExitCode(runSkillsLockCheck),
    },
    {
      id: '19',
      label: 'Run consumer startup triage bundle',
      execute: async () => {
        const triage = await params.prompts.askConsumerStartupTriage();
        await runConsumerStartupTriage(triage);
      },
    },
    {
      id: '20',
      label: 'Build mock consumer A/B validation report',
      execute: async () => {
        const report = await params.prompts.askMockConsumerAbReport();
        await runMockConsumerAbReport(report);
      },
    },
  ];
};
