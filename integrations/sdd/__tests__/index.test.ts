import assert from 'node:assert/strict';
import test from 'node:test';
import * as sdd from '../index';
import { evaluateSddPolicy, readSddStatus } from '../policy';
import { closeSddSession, openSddSession, readSddSession, refreshSddSession } from '../sessionStore';
import { runSddAutoSync, runSddLearn, runSddSyncDocs } from '../syncDocs';
import { runSddEvidenceScaffold } from '../evidenceScaffold';
import { runSddStateSync } from '../stateSync';

test('sdd index re-exports policy and sessionStore runtime API', () => {
  assert.strictEqual(sdd.evaluateSddPolicy, evaluateSddPolicy);
  assert.strictEqual(sdd.readSddStatus, readSddStatus);
  assert.strictEqual(sdd.openSddSession, openSddSession);
  assert.strictEqual(sdd.readSddSession, readSddSession);
  assert.strictEqual(sdd.refreshSddSession, refreshSddSession);
  assert.strictEqual(sdd.closeSddSession, closeSddSession);
  assert.strictEqual(sdd.runSddSyncDocs, runSddSyncDocs);
  assert.strictEqual(sdd.runSddLearn, runSddLearn);
  assert.strictEqual(sdd.runSddAutoSync, runSddAutoSync);
  assert.strictEqual(sdd.runSddEvidenceScaffold, runSddEvidenceScaffold);
  assert.strictEqual(sdd.runSddStateSync, runSddStateSync);
});

test('sdd index exposes only the expected runtime symbols', () => {
  assert.deepEqual(Object.keys(sdd).sort(), [
    'closeSddSession',
    'evaluateSddPolicy',
    'openSddSession',
    'readSddSession',
    'readSddStatus',
    'refreshSddSession',
    'runSddAutoSync',
    'runSddEvidenceScaffold',
    'runSddLearn',
    'runSddStateSync',
    'runSddSyncDocs',
  ]);
});
