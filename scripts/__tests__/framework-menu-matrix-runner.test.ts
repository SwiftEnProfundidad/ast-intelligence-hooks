import assert from 'node:assert/strict';
import test from 'node:test';
import { runConsumerMenuMatrix } from '../framework-menu-matrix-runner-lib';

test('runConsumerMenuMatrix ejecuta 1/2/3/4/9 y devuelve contrato mínimo por opción', async () => {
  const result = await runConsumerMenuMatrix({ repoRoot: process.cwd() });

  assert.deepEqual(Object.keys(result.byOption), ['1', '2', '3', '4', '9']);

  const option1 = result.byOption['1'];
  const option2 = result.byOption['2'];
  const option3 = result.byOption['3'];
  const option4 = result.byOption['4'];
  const option9 = result.byOption['9'];

  assert.ok(option1, 'Expected option 1 report');
  assert.ok(option2, 'Expected option 2 report');
  assert.ok(option3, 'Expected option 3 report');
  assert.ok(option4, 'Expected option 4 report');
  assert.ok(option9, 'Expected option 9 report');

  assert.equal(typeof option1.stage, 'string');
  assert.equal(typeof option1.outcome, 'string');
  assert.equal(typeof option1.filesScanned, 'number');
  assert.equal(typeof option1.totalViolations, 'number');
  assert.equal(typeof option1.diagnosis, 'string');

  assert.equal(typeof option2.stage, 'string');
  assert.equal(typeof option2.outcome, 'string');
  assert.equal(typeof option2.filesScanned, 'number');
  assert.equal(typeof option2.totalViolations, 'number');
  assert.equal(typeof option2.diagnosis, 'string');

  assert.equal(typeof option3.stage, 'string');
  assert.equal(typeof option3.outcome, 'string');
  assert.equal(typeof option3.filesScanned, 'number');
  assert.equal(typeof option3.totalViolations, 'number');
  assert.equal(typeof option3.diagnosis, 'string');

  assert.equal(typeof option4.stage, 'string');
  assert.equal(typeof option4.outcome, 'string');
  assert.equal(typeof option4.filesScanned, 'number');
  assert.equal(typeof option4.totalViolations, 'number');
  assert.equal(typeof option4.diagnosis, 'string');

  assert.equal(typeof option9.stage, 'string');
  assert.equal(typeof option9.outcome, 'string');
  assert.equal(typeof option9.filesScanned, 'number');
  assert.equal(typeof option9.totalViolations, 'number');
  assert.equal(typeof option9.diagnosis, 'string');
});
