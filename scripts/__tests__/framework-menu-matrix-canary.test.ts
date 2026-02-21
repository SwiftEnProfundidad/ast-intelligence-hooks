import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveConsumerMenuCanaryScenario,
  runConsumerMenuCanary,
} from '../framework-menu-matrix-canary-lib';

test('resolveConsumerMenuCanaryScenario mapea stage/plataforma a opción y regla esperada (edge path)', () => {
  const backendScenario = resolveConsumerMenuCanaryScenario({
    stage: 'PRE_COMMIT',
    platform: 'backend',
  });
  assert.equal(backendScenario.option, '1');
  assert.equal(backendScenario.expectedRuleId, 'skills.backend.no-empty-catch');

  const frontendScenario = resolveConsumerMenuCanaryScenario({
    stage: 'PRE_PUSH',
    platform: 'frontend',
  });
  assert.equal(frontendScenario.option, '2');
  assert.equal(frontendScenario.expectedRuleId, 'skills.frontend.avoid-explicit-any');
});

test('runConsumerMenuCanary inyecta violación temporal y exige detección en opción 1 (repo)', async () => {
  const result = await runConsumerMenuCanary({ repoRoot: process.cwd() });

  assert.equal(result.option, '1');
  assert.equal(typeof result.detected, 'boolean');
  assert.equal(typeof result.totalViolations, 'number');
  assert.equal(typeof result.filesScanned, 'number');
  assert.equal(typeof result.ruleIds.includes('skills.backend.no-empty-catch'), 'boolean');

  assert.equal(
    result.detected,
    true,
    'Expected canary detection in option 1 to be true'
  );
});

test('runConsumerMenuCanary permite canario controlado por stage/plataforma (happy path PRE_PUSH/frontend)', async () => {
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
