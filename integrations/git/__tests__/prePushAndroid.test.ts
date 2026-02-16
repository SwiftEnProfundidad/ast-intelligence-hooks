import assert from 'node:assert/strict';
import test from 'node:test';
import { runPrePushAndroid } from '../prePushAndroid';
import { runPrePushStage } from '../stageRunners';

test('runPrePushAndroid referencia el runner de etapa PRE_PUSH compartido', () => {
  assert.equal(runPrePushAndroid, runPrePushStage);
});
