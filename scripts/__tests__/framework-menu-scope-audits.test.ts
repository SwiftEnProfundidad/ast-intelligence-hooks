import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import type { FrameworkMenuActionContext } from '../framework-menu-action-contract';

const createMenuContext = (callbacks?: {
  onRepo?: () => Promise<void>;
  onRepoAndStaged?: () => Promise<void>;
  onWorkingTree?: () => Promise<void>;
}): FrameworkMenuActionContext => {
  return {
    prompts: {} as FrameworkMenuActionContext['prompts'],
    runStaged: async () => {},
    runRange: async () => {},
    runRepoAudit: callbacks?.onRepo ?? (async () => {}),
    runRepoAndStagedAudit: callbacks?.onRepoAndStaged ?? (async () => {}),
    runStagedAndUnstagedAudit: callbacks?.onWorkingTree ?? (async () => {}),
    resolveDefaultRangeFrom: () => 'origin/main',
    printActiveSkillsBundles: () => {},
  };
};

test('framework menu expone acciones de auditoria repo completo y working tree', async () => {
  let repoCalls = 0;
  let repoAndStagedCalls = 0;
  let workingTreeCalls = 0;
  const actions = createFrameworkMenuActions(
    createMenuContext({
      onRepo: async () => {
        repoCalls += 1;
      },
      onRepoAndStaged: async () => {
        repoAndStagedCalls += 1;
      },
      onWorkingTree: async () => {
        workingTreeCalls += 1;
      },
    })
  );

  const repoAction = actions.find((action) => action.id === '28');
  const repoAndStagedAction = actions.find((action) => action.id === '29');
  const workingTreeAction = actions.find((action) => action.id === '30');

  assert.ok(repoAction);
  assert.ok(repoAndStagedAction);
  assert.ok(workingTreeAction);
  assert.match(repoAction.label, /repo completo|full repo|full repository/i);
  assert.match(repoAndStagedAction.label, /repo.*staged|full repo.*staged/i);
  assert.match(workingTreeAction.label, /staged.*unstaged|working tree/i);

  await repoAction.execute();
  await repoAndStagedAction.execute();
  await workingTreeAction.execute();

  assert.equal(repoCalls, 1);
  assert.equal(repoAndStagedCalls, 1);
  assert.equal(workingTreeCalls, 1);
});
