import assert from 'node:assert/strict';
import test from 'node:test';
import type { GateOutcome } from './GateOutcome';

test('GateOutcome soporta PASS, WARN y BLOCK', () => {
  const passOutcome: GateOutcome = 'PASS';
  const warnOutcome: GateOutcome = 'WARN';
  const blockOutcome: GateOutcome = 'BLOCK';

  assert.equal(passOutcome, 'PASS');
  assert.equal(warnOutcome, 'WARN');
  assert.equal(blockOutcome, 'BLOCK');
});

test('GateOutcome permite colecciones de outcomes tipados', () => {
  const outcomes: GateOutcome[] = ['PASS', 'WARN', 'BLOCK'];

  assert.equal(outcomes.length, 3);
  assert.deepEqual(outcomes, ['PASS', 'WARN', 'BLOCK']);
});
