import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import {
  createConsumerLegacyMenuActions,
  type ConsumerLegacyMenuContext,
} from '../framework-menu-consumer-actions-lib';
import {
  ADVANCED_MENU_LAYOUT,
  CONSUMER_MENU_LAYOUT,
  flattenMenuLayoutIds,
  hasFullLayoutCoverage,
} from '../framework-menu-layout-lib';
import { createFrameworkMenuPrompts } from '../framework-menu-prompts';

const noop = async (): Promise<void> => {};

const buildConsumerActions = () =>
  createConsumerLegacyMenuActions({
    runFullAudit: noop,
    runStrictRepoAndStaged: noop,
    runStrictStagedOnly: noop,
    runStandardCriticalHigh: noop,
    runEngineStagedNoPreflight: noop,
    runEngineUnstagedNoPreflight: noop,
    runEngineStagedAndUnstagedNoPreflight: noop,
    runEngineFullRepoNoPreflight: noop,
    runPatternChecks: noop,
    runEslintAudit: noop,
    runAstIntelligence: noop,
    runFileDiagnostics: noop,
    runExportMarkdown: noop,
  } satisfies ConsumerLegacyMenuContext);

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

test('flattenMenuLayoutIds conserva el orden declarado', () => {
  assert.deepEqual(flattenMenuLayoutIds(CONSUMER_MENU_LAYOUT), ['1', '2', '3', '4', '11', '12', '13', '14', '8', '5', '6', '7', '9', '10']);
});

test('hasFullLayoutCoverage valida el layout consumer completo', () => {
  const actions = buildConsumerActions();
  assert.equal(
    hasFullLayoutCoverage(CONSUMER_MENU_LAYOUT, actions.map((action) => action.id)),
    true
  );
});

test('hasFullLayoutCoverage valida el layout advanced completo', () => {
  const actions = buildAdvancedActions();
  assert.equal(
    hasFullLayoutCoverage(ADVANCED_MENU_LAYOUT, actions.map((action) => action.id)),
    true
  );
});

test('hasFullLayoutCoverage falla si falta un id o sobra otro', () => {
  assert.equal(hasFullLayoutCoverage(CONSUMER_MENU_LAYOUT, ['1', '2']), false);
  assert.equal(hasFullLayoutCoverage(CONSUMER_MENU_LAYOUT, [...flattenMenuLayoutIds(CONSUMER_MENU_LAYOUT), '99']), false);
});
