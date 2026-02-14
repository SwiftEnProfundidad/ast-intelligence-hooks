import { runCiBackend } from '../integrations/git/ciBackend';
import { runCiFrontend } from '../integrations/git/ciFrontend';
import { runCiIOS } from '../integrations/git/ciIOS';
import { runAndPrintExitCode } from './framework-menu-runners';
import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuGateCiActions = (
  _params: FrameworkMenuActionContext
): ReadonlyArray<MenuAction> => {
  return [
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
  ];
};
