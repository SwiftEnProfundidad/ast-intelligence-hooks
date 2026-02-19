import assert from 'node:assert/strict';
import test from 'node:test';
import { runPrePushIOS } from '../prePushIOS';
import { runPrePushStage } from '../stageRunners';

test('runPrePushIOS referencia el runner de etapa PRE_PUSH compartido', () => {
  assert.equal(runPrePushIOS, runPrePushStage);
});
