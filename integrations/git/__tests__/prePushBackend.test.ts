import assert from 'node:assert/strict';
import test from 'node:test';
import { runPrePushBackend } from '../prePushBackend';
import { runPrePushStage } from '../stageRunners';

test('runPrePushBackend referencia el runner de etapa PRE_PUSH compartido', () => {
  assert.equal(runPrePushBackend, runPrePushStage);
});
