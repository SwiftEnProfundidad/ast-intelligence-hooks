import assert from 'node:assert/strict';
import test from 'node:test';
import { runCiFrontend } from '../ciFrontend';
import { runCiStage } from '../stageRunners';

test('runCiFrontend referencia el runner de etapa CI compartido', () => {
  assert.equal(runCiFrontend, runCiStage);
});
