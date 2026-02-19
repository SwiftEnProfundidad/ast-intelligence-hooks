import assert from 'node:assert/strict';
import test from 'node:test';
import { runPreCommitBackend } from '../preCommitBackend';
import { runPreCommitStage } from '../stageRunners';

test('runPreCommitBackend referencia el runner de etapa PRE_COMMIT compartido', () => {
  assert.equal(runPreCommitBackend, runPreCommitStage);
});
