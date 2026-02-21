import assert from 'node:assert/strict';
import test from 'node:test';
import { runConsumerMenuCanary } from '../framework-menu-matrix-canary-lib';

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
