import assert from 'node:assert/strict';
import test from 'node:test';
import { runPreCommitAndroid } from '../preCommitAndroid';
import { runPreCommitStage } from '../stageRunners';

test('runPreCommitAndroid referencia el runner de etapa PRE_COMMIT compartido', () => {
  assert.equal(runPreCommitAndroid, runPreCommitStage);
});
