import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import { createFrameworkMenuPrompts } from '../framework-menu-prompts';
import { formatAdvancedMenuView } from '../framework-menu';

const noop = async (): Promise<void> => {};

const buildAdvancedActions = () => {
  const fakeRl = {
    question: async () => '',
  };
  const prompts = createFrameworkMenuPrompts(
    fakeRl as unknown as Parameters<typeof createFrameworkMenuPrompts>[0]
  );
  return createFrameworkMenuActions({
    prompts,
    runStaged: noop,
    runRange: noop,
    runRepoAudit: noop,
    runRepoAndStagedAudit: noop,
    runStagedAndUnstagedAudit: noop,
    resolveDefaultRangeFrom: () => 'HEAD~1',
    printActiveSkillsBundles: () => {},
  });
};

test('formatAdvancedMenuView renderiza secciones por dominio y ayuda contextual corta', () => {
  const rendered = formatAdvancedMenuView(buildAdvancedActions(), {
    evidenceSummary: {
      status: 'ok',
      stage: 'PRE_PUSH',
      outcome: 'PASS',
      totalFindings: 0,
      bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
      topFiles: [],
    },
  });

  assert.match(rendered, /Pumuki Framework Menu \(Advanced\)/);
  assert.match(rendered, /\b1\)\s+Gates\b/);
  assert.match(rendered, /\b2\)\s+Diagnostics\b/);
  assert.match(rendered, /\b3\)\s+Maintenance\b/);
  assert.match(rendered, /\b4\)\s+Validation\b/);
  assert.match(rendered, /\b5\)\s+System\b/);
  assert.match(rendered, /1\)\s+Evaluate staged changes \(PRE_COMMIT policy\)\s+-\s+Evalua solo los cambios staged/i);
  assert.match(rendered, /27\)\s+Exit/);
});

test('formatAdvancedMenuView muestra badge WARN cuando falta evidencia', () => {
  const rendered = formatAdvancedMenuView(buildAdvancedActions(), {
    evidenceSummary: {
      status: 'missing',
      stage: null,
      outcome: null,
      totalFindings: 0,
      bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
      topFiles: [],
    },
  });

  assert.match(rendered, /WARN/);
});
