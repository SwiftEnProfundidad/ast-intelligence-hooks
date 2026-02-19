import assert from 'node:assert/strict';
import test from 'node:test';
import { runPreCommitFrontend } from '../preCommitFrontend';
import { runPreCommitStage } from '../stageRunners';

test('runPreCommitFrontend referencia el runner de etapa PRE_COMMIT compartido', () => {
  assert.equal(runPreCommitFrontend, runPreCommitStage);
});
