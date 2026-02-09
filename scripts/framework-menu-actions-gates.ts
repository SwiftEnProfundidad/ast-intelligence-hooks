import { runCiBackend } from '../integrations/git/ciBackend';
import { runCiFrontend } from '../integrations/git/ciFrontend';
import { runCiIOS } from '../integrations/git/ciIOS';
import { printEvidence, runAndPrintExitCode } from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuGateActions = (
  params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
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
  ];
};
