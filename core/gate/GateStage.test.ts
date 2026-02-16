import assert from 'node:assert/strict';
import test from 'node:test';
import type { GateStage } from './GateStage';

test('GateStage soporta STAGED, PRE_COMMIT, PRE_PUSH y CI', () => {
  const staged: GateStage = 'STAGED';
  const preCommit: GateStage = 'PRE_COMMIT';
  const prePush: GateStage = 'PRE_PUSH';
  const ci: GateStage = 'CI';

  assert.equal(staged, 'STAGED');
  assert.equal(preCommit, 'PRE_COMMIT');
  assert.equal(prePush, 'PRE_PUSH');
  assert.equal(ci, 'CI');
});

test('GateStage permite colecciones tipadas de stages', () => {
  const stages: GateStage[] = ['STAGED', 'PRE_COMMIT', 'PRE_PUSH', 'CI'];

  assert.equal(stages.length, 4);
  assert.deepEqual(stages, ['STAGED', 'PRE_COMMIT', 'PRE_PUSH', 'CI']);
});
