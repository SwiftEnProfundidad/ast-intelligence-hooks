import assert from 'node:assert/strict';
import test from 'node:test';
import type { GatePolicy } from './GatePolicy';

test('GatePolicy conserva stage, blockOnOrAbove y warnOnOrAbove', () => {
  const policy: GatePolicy = {
    stage: 'PRE_PUSH',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
  };

  assert.equal(policy.stage, 'PRE_PUSH');
  assert.equal(policy.blockOnOrAbove, 'ERROR');
  assert.equal(policy.warnOnOrAbove, 'WARN');
  assert.equal(policy.defaultSeverity, undefined);
});

test('GatePolicy permite defaultSeverity opcional', () => {
  const policy: GatePolicy = {
    stage: 'CI',
    blockOnOrAbove: 'ERROR',
    warnOnOrAbove: 'WARN',
    defaultSeverity: 'INFO',
  };

  assert.equal(policy.stage, 'CI');
  assert.equal(policy.defaultSeverity, 'INFO');
});
