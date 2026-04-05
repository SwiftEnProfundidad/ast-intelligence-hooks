import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import {
  createConsumerLegacyMenuActions,
  type ConsumerLegacyMenuContext,
} from '../framework-menu-consumer-actions-lib';
import { resolveAdvancedMenuLayout, resolveConsumerMenuLayout } from '../framework-menu-layout-lib';
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

test('resolveConsumerMenuLayout mantiene jerarquía por flujo', () => {
  const actions = buildConsumerActions();
  const groups = resolveConsumerMenuLayout(actions);
  assert.equal(groups.length, 4);
  assert.equal(groups[0]?.title, 'Read-Only Gate Flows');
  assert.deepEqual(groups[0]?.items.map((item) => item.id), ['1', '2', '3', '4']);
  assert.equal(groups[1]?.title, 'Legacy Read-Only Export');
  assert.deepEqual(groups[1]?.items.map((item) => item.id), ['8']);
  assert.equal(groups[2]?.title, 'Legacy Read-Only Diagnostics');
  assert.deepEqual(groups[2]?.items.map((item) => item.id), ['5', '6', '7', '9']);
  assert.equal(groups[3]?.title, 'System');
  assert.deepEqual(groups[3]?.items.map((item) => item.id), ['10']);
});

test('resolveAdvancedMenuLayout agrupa por dominios', () => {
  const actions = buildAdvancedActions();
  const groups = resolveAdvancedMenuLayout(actions);
  assert.equal(groups[0]?.title, 'Gates');
  assert.deepEqual(groups[0]?.items.map((item) => item.id), ['1', '2', '3', '4', '5', '6', '7', '8']);
  assert.equal(groups[1]?.title, 'Diagnostics');
  assert.equal(groups[2]?.title, 'Legacy Read-Only Audits');
  assert.deepEqual(groups[2]?.items.map((item) => item.id), ['28', '29', '30', '32']);
  assert.equal(groups[3]?.title, 'Maintenance');
  assert.equal(groups[4]?.title, 'Validation');
  assert.equal(groups[5]?.title, 'System');
  assert.deepEqual(groups[5]?.items.map((item) => item.id), ['27']);
});
