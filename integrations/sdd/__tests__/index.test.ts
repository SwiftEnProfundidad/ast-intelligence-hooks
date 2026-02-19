import assert from 'node:assert/strict';
import test from 'node:test';
import * as sdd from '../index';
import { evaluateSddPolicy, readSddStatus } from '../policy';
import { closeSddSession, openSddSession, readSddSession, refreshSddSession } from '../sessionStore';

test('sdd index re-exports policy and sessionStore runtime API', () => {
  assert.strictEqual(sdd.evaluateSddPolicy, evaluateSddPolicy);
  assert.strictEqual(sdd.readSddStatus, readSddStatus);
  assert.strictEqual(sdd.openSddSession, openSddSession);
  assert.strictEqual(sdd.readSddSession, readSddSession);
  assert.strictEqual(sdd.refreshSddSession, refreshSddSession);
  assert.strictEqual(sdd.closeSddSession, closeSddSession);
});

test('sdd index exposes only the expected runtime symbols', () => {
  assert.deepEqual(Object.keys(sdd).sort(), [
    'closeSddSession',
    'evaluateSddPolicy',
    'openSddSession',
    'readSddSession',
    'readSddStatus',
    'refreshSddSession',
  ]);
});
