import assert from 'node:assert/strict';
import test from 'node:test';
import { runPrePushFrontend } from '../prePushFrontend';
import { runPrePushStage } from '../stageRunners';

test('runPrePushFrontend referencia el runner de etapa PRE_PUSH compartido', () => {
  assert.equal(runPrePushFrontend, runPrePushStage);
});
