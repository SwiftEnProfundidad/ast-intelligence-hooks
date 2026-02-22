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
  hasFullLayoutCoverage,
  resolveAdvancedMenuLayout,
  resolveConsumerMenuLayout,
} from '../framework-menu-layout-lib';
import { createFrameworkMenuPrompts } from '../framework-menu-prompts';

const noop = async (): Promise<void> => {};

const buildConsumerActions = () =>
  createConsumerLegacyMenuActions({
    runFullAudit: noop,
    runStrictRepoAndStaged: noop,
    runStrictStagedOnly: noop,
    runStandardCriticalHigh: noop,
    runPatternChecks: noop,
    runEslintAudit: noop,
    runAstIntelligence: noop,
    runFileDiagnostics: noop,
    runExportMarkdown: noop,
  } satisfies ConsumerLegacyMenuContext);

test('consumer layout canonical mantiene jerarquia por flujo', () => {
  const actions = buildConsumerActions();
  const groups = resolveConsumerMenuLayout(actions);
  assert.equal(groups.length, 4);
  assert.equal(groups[0]?.title, 'Audit Flows');
  assert.deepEqual(groups[0]?.items.map((item) => item.id), ['1', '2', '3', '4']);
  assert.equal(groups[1]?.title, 'Diagnostics');
  assert.deepEqual(groups[1]?.items.map((item) => item.id), ['5', '6', '7', '9']);
  assert.equal(groups[2]?.title, 'Export');
  assert.deepEqual(groups[2]?.items.map((item) => item.id), ['8']);
  assert.equal(groups[3]?.title, 'System');
  assert.deepEqual(groups[3]?.items.map((item) => item.id), ['10']);
});

test('consumer layout cubre todas las acciones sin huecos', () => {
  const actions = buildConsumerActions();
  assert.equal(
    hasFullLayoutCoverage(CONSUMER_MENU_LAYOUT, actions.map((action) => action.id)),
    true
  );
});

test('advanced layout canonical agrupa por dominios', () => {
  const fakeRl = {
    question: async () => '',
  };
  const prompts = createFrameworkMenuPrompts(
    fakeRl as unknown as Parameters<typeof createFrameworkMenuPrompts>[0]
  );
  const actions = createFrameworkMenuActions({
    prompts,
    runStaged: noop,
    runRange: noop,
    runRepoAudit: noop,
    runRepoAndStagedAudit: noop,
    runStagedAndUnstagedAudit: noop,
    resolveDefaultRangeFrom: () => 'HEAD~1',
    printActiveSkillsBundles: () => {},
  });
  const groups = resolveAdvancedMenuLayout(actions);
  assert.equal(groups[0]?.title, 'Gates');
  assert.deepEqual(groups[0]?.items.map((item) => item.id), ['1', '2', '3', '28', '29', '30', '4', '5', '6', '7', '8']);
  assert.equal(groups[1]?.title, 'Diagnostics');
  assert.equal(groups[2]?.title, 'Maintenance');
  assert.equal(groups[3]?.title, 'Validation');
  assert.equal(groups[4]?.title, 'System');
  assert.deepEqual(groups[4]?.items.map((item) => item.id), ['27']);
});

test('advanced layout cubre todas las acciones sin huecos', () => {
  const fakeRl = {
    question: async () => '',
  };
  const prompts = createFrameworkMenuPrompts(
    fakeRl as unknown as Parameters<typeof createFrameworkMenuPrompts>[0]
  );
  const actions = createFrameworkMenuActions({
    prompts,
    runStaged: noop,
    runRange: noop,
    runRepoAudit: noop,
    runRepoAndStagedAudit: noop,
    runStagedAndUnstagedAudit: noop,
    resolveDefaultRangeFrom: () => 'HEAD~1',
    printActiveSkillsBundles: () => {},
  });
  assert.equal(
    hasFullLayoutCoverage(ADVANCED_MENU_LAYOUT, actions.map((action) => action.id)),
    true
  );
});
