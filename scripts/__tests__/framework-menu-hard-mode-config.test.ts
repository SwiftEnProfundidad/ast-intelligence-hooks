import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import type { FrameworkMenuActionContext } from '../framework-menu-action-contract';

const createMenuContext = (): FrameworkMenuActionContext => {
  return {
    prompts: {} as FrameworkMenuActionContext['prompts'],
    runStaged: async () => {},
    runRange: async () => {},
    resolveDefaultRangeFrom: () => 'origin/main',
    printActiveSkillsBundles: () => {},
  };
};

test('framework menu expone accion para configurar hard mode enterprise', () => {
  const actions = createFrameworkMenuActions(createMenuContext());
  const hardModeAction = actions.find((action) => action.id === '18');

  assert.ok(hardModeAction);
  assert.match(hardModeAction.label, /hard mode|enforcement|config/i);
});
