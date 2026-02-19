import assert from 'node:assert/strict';
import test from 'node:test';
import { runCiAndroid } from '../ciAndroid';
import { runCiStage } from '../stageRunners';

test('runCiAndroid referencia el runner de etapa CI compartido', () => {
  assert.equal(runCiAndroid, runCiStage);
});
