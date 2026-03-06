import assert from 'node:assert/strict';
import test from 'node:test';

import { runConsumerMenuCanary } from '../framework-menu-matrix-canary-lib';

test('runConsumerMenuCanary inyecta violación temporal y exige detección en opción 1', async () => {
  const result = await runConsumerMenuCanary({ repoRoot: process.cwd() });

  assert.equal(result.option, '1');
  assert.equal(typeof result.detected, 'boolean');
  assert.equal(typeof result.totalViolations, 'number');
  assert.equal(typeof result.filesScanned, 'number');
  assert.equal(typeof result.ruleIds.includes('skills.backend.no-empty-catch'), 'boolean');
  assert.equal(result.detected, true);
});

test('runConsumerMenuCanary permite canario controlado PRE_PUSH/frontend', async () => {
  const result = await runConsumerMenuCanary({
    repoRoot: process.cwd(),
    stage: 'PRE_PUSH',
    platform: 'frontend',
    dependencies: {
      runGate: async () => {},
      readOptionReport: () => ({
        stage: 'PRE_PUSH',
        outcome: 'BLOCK',
        filesScanned: 50,
        totalViolations: 1,
        diagnosis: 'violations-detected',
      }),
      extractRuleIds: () => ['skills.frontend.avoid-explicit-any'],
    },
  });

  assert.equal(result.option, '2');
  assert.equal(result.detected, true);
  assert.equal(result.totalViolations, 1);
  assert.equal(result.filesScanned, 50);
  assert.equal(result.ruleIds.includes('skills.frontend.avoid-explicit-any'), true);
});

test('runConsumerMenuCanary soporta canario controlado CI/android', async () => {
  const result = await runConsumerMenuCanary({
    repoRoot: process.cwd(),
    stage: 'CI',
    platform: 'android',
    dependencies: {
      runGate: async () => {},
      readOptionReport: () => ({
        stage: 'CI',
        outcome: 'BLOCK',
        filesScanned: 75,
        totalViolations: 1,
        diagnosis: 'violations-detected',
      }),
      extractRuleIds: () => ['skills.android.no-runblocking'],
    },
  });

  assert.equal(result.option, '2');
  assert.equal(result.detected, true);
  assert.equal(result.totalViolations, 1);
  assert.equal(result.filesScanned, 75);
  assert.equal(result.ruleIds.includes('skills.android.no-runblocking'), true);
});
