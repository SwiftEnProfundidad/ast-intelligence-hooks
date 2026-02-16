import assert from 'node:assert/strict';
import test from 'node:test';
import { runCiIOS } from '../ciIOS';
import { runCiStage } from '../stageRunners';

test('runCiIOS referencia el runner de etapa CI compartido', () => {
  assert.equal(runCiIOS, runCiStage);
});
