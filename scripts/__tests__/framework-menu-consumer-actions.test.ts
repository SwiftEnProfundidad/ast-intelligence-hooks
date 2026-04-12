import assert from 'node:assert/strict';
import test from 'node:test';
import { createConsumerLegacyMenuActions } from '../framework-menu-consumer-actions-lib';

test('createConsumerLegacyMenuActions expone shell read-only mínima y diagnósticos legacy explícitos', async () => {
  let repo = 0;
  let repoAndStaged = 0;
  let staged = 0;
  let standard = 0;
  let engineStaged = 0;
  let engineUnstaged = 0;
  let engineBoth = 0;
  let engineFullRepo = 0;
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
    runEngineStagedNoPreflight: async () => {
      engineStaged += 1;
    },
    runEngineUnstagedNoPreflight: async () => {
      engineUnstaged += 1;
    },
    runEngineStagedAndUnstagedNoPreflight: async () => {
      engineBoth += 1;
    },
    runEngineFullRepoNoPreflight: async () => {
      engineFullRepo += 1;
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
    ['1', '2', '3', '4', '11', '12', '13', '14', '5', '6', '7', '8', '9', '10']
  );
  assert.match(actions[0]?.label ?? '', /ALL tracked files/i);
  assert.match(actions[1]?.label ?? '', /REPO\+index contract/i);
  assert.match(actions[2]?.label ?? '', /STAGED only \(PRE_COMMIT\)/i);
  assert.match(actions[3]?.label ?? '', /working tree \(PRE_PUSH policy/i);
  assert.match(actions[4]?.label ?? '', /Engine audit · STAGED only/i);
  assert.match(actions[5]?.label ?? '', /Engine audit · UNSTAGED only/i);
  assert.match(actions[6]?.label ?? '', /Engine audit · STAGED \+ UNSTAGED/i);
  assert.match(actions[7]?.label ?? '', /FULL tracked repo/i);
  assert.match(actions[8]?.label ?? '', /Legacy read-only pattern checks snapshot/i);
  assert.match(actions[9]?.label ?? '', /Legacy read-only ESLint evidence snapshot/i);
  assert.match(actions[10]?.label ?? '', /Legacy read-only AST snapshot/i);
  assert.match(actions[11]?.label ?? '', /Export legacy read-only evidence snapshot/i);
  assert.match(actions[12]?.label ?? '', /Legacy read-only file diagnostics snapshot/i);

  for (const action of actions.filter((entry) => entry.id !== '10')) {
    await action.execute();
  }

  assert.equal(repo, 1);
  assert.equal(repoAndStaged, 1);
  assert.equal(staged, 1);
  assert.equal(standard, 1);
  assert.equal(engineStaged, 1);
  assert.equal(engineUnstaged, 1);
  assert.equal(engineBoth, 1);
  assert.equal(engineFullRepo, 1);
  assert.equal(pattern, 1);
  assert.equal(eslint, 1);
  assert.equal(ast, 1);
  assert.equal(diagnostics, 1);
  assert.equal(exported, 1);
});
