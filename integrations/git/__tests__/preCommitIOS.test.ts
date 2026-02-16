import assert from 'node:assert/strict';
import test from 'node:test';
import { runPreCommitIOS } from '../preCommitIOS';
import { runPreCommitStage } from '../stageRunners';

test('runPreCommitIOS referencia el runner de etapa PRE_COMMIT compartido', () => {
  assert.equal(runPreCommitIOS, runPreCommitStage);
});
