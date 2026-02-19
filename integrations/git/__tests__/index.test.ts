import assert from 'node:assert/strict';
import test from 'node:test';
import * as gitIndex from '../index';
import { evaluateStagedIOS } from '../evaluateStagedIOS';
import { runCiAndroid } from '../ciAndroid';
import { runCiBackend } from '../ciBackend';
import { runCiFrontend } from '../ciFrontend';
import { runCiIOS } from '../ciIOS';
import { runPreCommitAndroid } from '../preCommitAndroid';
import { runPreCommitBackend } from '../preCommitBackend';
import { runPreCommitFrontend } from '../preCommitFrontend';
import { runPreCommitIOS } from '../preCommitIOS';
import { runPrePushAndroid } from '../prePushAndroid';
import { runPrePushBackend } from '../prePushBackend';
import { runPrePushFrontend } from '../prePushFrontend';
import { runPrePushIOS } from '../prePushIOS';

test('git index re-exporta los runners y evaluateStagedIOS', () => {
  assert.strictEqual(gitIndex.evaluateStagedIOS, evaluateStagedIOS);
  assert.strictEqual(gitIndex.runCiAndroid, runCiAndroid);
  assert.strictEqual(gitIndex.runCiBackend, runCiBackend);
  assert.strictEqual(gitIndex.runCiFrontend, runCiFrontend);
  assert.strictEqual(gitIndex.runCiIOS, runCiIOS);
  assert.strictEqual(gitIndex.runPreCommitAndroid, runPreCommitAndroid);
  assert.strictEqual(gitIndex.runPreCommitBackend, runPreCommitBackend);
  assert.strictEqual(gitIndex.runPreCommitFrontend, runPreCommitFrontend);
  assert.strictEqual(gitIndex.runPreCommitIOS, runPreCommitIOS);
  assert.strictEqual(gitIndex.runPrePushAndroid, runPrePushAndroid);
  assert.strictEqual(gitIndex.runPrePushBackend, runPrePushBackend);
  assert.strictEqual(gitIndex.runPrePushFrontend, runPrePushFrontend);
  assert.strictEqual(gitIndex.runPrePushIOS, runPrePushIOS);
});

test('git index expone funciones ejecutables', () => {
  assert.equal(typeof gitIndex.evaluateStagedIOS, 'function');
  assert.equal(typeof gitIndex.runCiAndroid, 'function');
  assert.equal(typeof gitIndex.runCiBackend, 'function');
  assert.equal(typeof gitIndex.runCiFrontend, 'function');
  assert.equal(typeof gitIndex.runCiIOS, 'function');
  assert.equal(typeof gitIndex.runPreCommitAndroid, 'function');
  assert.equal(typeof gitIndex.runPreCommitBackend, 'function');
  assert.equal(typeof gitIndex.runPreCommitFrontend, 'function');
  assert.equal(typeof gitIndex.runPreCommitIOS, 'function');
  assert.equal(typeof gitIndex.runPrePushAndroid, 'function');
  assert.equal(typeof gitIndex.runPrePushBackend, 'function');
  assert.equal(typeof gitIndex.runPrePushFrontend, 'function');
  assert.equal(typeof gitIndex.runPrePushIOS, 'function');
});
