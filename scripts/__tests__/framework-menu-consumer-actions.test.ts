import assert from 'node:assert/strict';
import test from 'node:test';
import { createConsumerLegacyMenuActions } from '../framework-menu-consumer-actions-lib';

test('createConsumerLegacyMenuActions expone opciones 1..9 con labels legacy esperadas', async () => {
  let repo = 0;
  let repoAndStaged = 0;
  let staged = 0;
  let standard = 0;
  let pattern = 0;
  let eslint = 0;
  let ast = 0;
  let diagnostics = 0;
  let exported = 0;

  const actions = createConsumerLegacyMenuActions({
    runFullAudit: async () => {
      repo += 1;
    },
    runStrictRepoAndStaged: async () => {
      repoAndStaged += 1;
    },
    runStrictStagedOnly: async () => {
      staged += 1;
    },
    runStandardCriticalHigh: async () => {
      standard += 1;
    },
    runPatternChecks: async () => {
      pattern += 1;
    },
    runEslintAudit: async () => {
      eslint += 1;
    },
    runAstIntelligence: async () => {
      ast += 1;
    },
    runFileDiagnostics: async () => {
      diagnostics += 1;
    },
    runExportMarkdown: async () => {
      exported += 1;
    },
  });

  assert.deepEqual(
    actions.map((action) => action.id),
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  );
  assert.match(actions[0]?.label ?? '', /Full audit/i);
  assert.match(actions[1]?.label ?? '', /Strict REPO\+STAGING/i);
  assert.match(actions[2]?.label ?? '', /Strict STAGING only/i);
  assert.match(actions[3]?.label ?? '', /Standard CRITICAL\/HIGH/i);

  for (const action of actions.slice(0, 9)) {
    await action.execute();
  }

  assert.equal(repo, 1);
  assert.equal(repoAndStaged, 1);
  assert.equal(staged, 1);
  assert.equal(standard, 1);
  assert.equal(pattern, 1);
  assert.equal(eslint, 1);
  assert.equal(ast, 1);
  assert.equal(diagnostics, 1);
  assert.equal(exported, 1);
});
