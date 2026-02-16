import assert from 'node:assert/strict';
import test from 'node:test';
import { runCiBackend } from '../ciBackend';
import { runCiStage } from '../stageRunners';

test('runCiBackend referencia el runner de etapa CI compartido', () => {
  assert.equal(runCiBackend, runCiStage);
});
