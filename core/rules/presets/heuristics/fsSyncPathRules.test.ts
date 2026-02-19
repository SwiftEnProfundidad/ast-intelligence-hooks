import assert from 'node:assert/strict';
import test from 'node:test';
import { fsSyncPathRules } from './fsSyncPathRules';

test('fsSyncPathRules define ruleset vacío (sin reglas path sync activas)', () => {
  assert.equal(fsSyncPathRules.length, 0);
  assert.deepEqual(fsSyncPathRules, []);
});
