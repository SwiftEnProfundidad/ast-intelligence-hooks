import assert from 'node:assert/strict';
import test from 'node:test';
import type { Consequence } from './Consequence';

test('Consequence conserva kind Finding y message obligatorio', () => {
  const consequence: Consequence = {
    kind: 'Finding',
    message: 'Detected a rule match.',
  };

  assert.equal(consequence.kind, 'Finding');
  assert.equal(consequence.message, 'Detected a rule match.');
  assert.equal(consequence.code, undefined);
});

test('Consequence permite code opcional', () => {
  const consequence: Consequence = {
    kind: 'Finding',
    message: 'Detected a rule match with explicit code.',
    code: 'RULE_MATCH_DETECTED',
  };

  assert.equal(consequence.kind, 'Finding');
  assert.equal(consequence.code, 'RULE_MATCH_DETECTED');
});
