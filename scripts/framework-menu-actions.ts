import { runCiBackend } from '../integrations/git/ciBackend';
import { runCiFrontend } from '../integrations/git/ciFrontend';
import { runCiIOS } from '../integrations/git/ciIOS';
import {
  runAdapterReadiness,
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
  runPhase5BlockersReadiness,
  runPhase5ExecutionClosure,
  runPhase5ExecutionClosureStatus,
  runPhase5ExternalHandoff,
  runSkillsLockCheck,
  runValidationArtifactsCleanup,
  runValidationDocsHygiene,
  printEvidence,
} from './framework-menu-runners';
import type { createFrameworkMenuPrompts } from './framework-menu-prompts';

type FrameworkMenuPrompts = ReturnType<typeof createFrameworkMenuPrompts>;

export type MenuAction = {
  id: string;
  label: string;
  execute: () => Promise<void>;
};

export const createFrameworkMenuActions = (params: {
  prompts: FrameworkMenuPrompts;
  runStaged: () => Promise<void>;
  runRange: (params: { fromRef: string; toRef: string; stage: 'PRE_PUSH' | 'CI' }) => Promise<void>;
  resolveDefaultRangeFrom: () => string;
  printActiveSkillsBundles: () => void;
}): ReadonlyArray<MenuAction> => {
  return [
    {
      id: '1',
      label: 'Evaluate staged changes (PRE_COMMIT policy)',
      execute: params.runStaged,
    },
    {
      id: '2',
      label: 'Evaluate commit range (PRE_PUSH policy)',
      execute: async () => {
        const range = await params.prompts.askRange(params.resolveDefaultRangeFrom());
        await params.runRange({ ...range, stage: 'PRE_PUSH' });
      },
    },
    {
      id: '3',
      label: 'Evaluate commit range (CI policy)',
      execute: async () => {
        const range = await params.prompts.askRange(params.resolveDefaultRangeFrom());
        await params.runRange({ ...range, stage: 'CI' });
      },
    },
    {
      id: '4',
      label: 'Run iOS CI gate',
      execute: async () => runAndPrintExitCode(runCiIOS),
    },
    {
      id: '5',
      label: 'Run Backend CI gate',
      execute: async () => runAndPrintExitCode(runCiBackend),
    },
    {
      id: '6',
      label: 'Run Frontend CI gate',
      execute: async () => runAndPrintExitCode(runCiFrontend),
    },
    {
      id: '7',
      label: 'Show active skills bundles (version + hash)',
      execute: async () => {
        params.printActiveSkillsBundles();
      },
    },
    {
      id: '8',
      label: 'Read current .ai_evidence.json',
      execute: async () => {
        printEvidence();
      },
    },
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
    {
      id: '21',
      label: 'Build phase5 blockers readiness report',
      execute: async () => {
        const report = await params.prompts.askPhase5BlockersReadiness();
        await runPhase5BlockersReadiness(report);
      },
    },
    {
      id: '22',
      label: 'Build adapter readiness report',
      execute: async () => {
        const report = await params.prompts.askAdapterReadiness();
        await runAdapterReadiness(report);
      },
    },
    {
      id: '23',
      label: 'Build phase5 execution closure status report',
      execute: async () => {
        const report = await params.prompts.askPhase5ExecutionClosureStatus();
        await runPhase5ExecutionClosureStatus(report);
      },
    },
    {
      id: '24',
      label: 'Run phase5 execution closure (one-shot orchestration)',
      execute: async () => {
        const runParams = await params.prompts.askPhase5ExecutionClosure();
        await runPhase5ExecutionClosure(runParams);
      },
    },
    {
      id: '25',
      label: 'Build phase5 external handoff report',
      execute: async () => {
        const reportParams = await params.prompts.askPhase5ExternalHandoff();
        await runPhase5ExternalHandoff(reportParams);
      },
    },
    {
      id: '26',
      label: 'Clean local validation artifacts',
      execute: async () => {
        const cleanParams = await params.prompts.askValidationArtifactsCleanup();
        await runAndPrintExitCode(() => runValidationArtifactsCleanup(cleanParams));
      },
    },
    {
      id: '27',
      label: 'Exit',
      execute: async () => {},
    },
  ];
};
