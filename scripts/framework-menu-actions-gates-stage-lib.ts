import type {
  FrameworkMenuActionContext,
  MenuAction,
} from './framework-menu-action-contract';

export const createFrameworkMenuGateStageActions = (
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
      id: '28',
      label: 'Legacy read-only audit: full repository snapshot (PRE_COMMIT policy)',
      execute: params.runRepoAudit,
    },
    {
      id: '29',
      label: 'Legacy read-only audit: repository + staged snapshot (PRE_COMMIT policy)',
      execute: params.runRepoAndStagedAudit,
    },
    {
      id: '30',
      label: 'Legacy read-only audit: staged + unstaged working tree (PRE_COMMIT policy)',
      execute: params.runStagedAndUnstagedAudit,
    },
  ];
};
