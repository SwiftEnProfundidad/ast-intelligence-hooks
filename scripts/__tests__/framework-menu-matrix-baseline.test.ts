import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeConsumerMenuMatrixBaseline,
  runConsumerMenuMatrixBaseline,
  type ConsumerMenuMatrixReport,
} from '../framework-menu-matrix-baseline-lib';

const buildRound = (overrides: Partial<ConsumerMenuMatrixReport['byOption']> = {}): ConsumerMenuMatrixReport => ({
  byOption: {
    '1': { stage: 'PRE_COMMIT', outcome: 'PASS', filesScanned: 100, totalViolations: 0, diagnosis: 'repo-clean' },
    '2': { stage: 'PRE_PUSH', outcome: 'BLOCK', filesScanned: 100, totalViolations: 3, diagnosis: 'violations-detected' },
    '3': { stage: 'PRE_COMMIT', outcome: 'PASS', filesScanned: 0, totalViolations: 0, diagnosis: 'scope-empty' },
    '4': { stage: 'PRE_PUSH', outcome: 'PASS', filesScanned: 0, totalViolations: 0, diagnosis: 'scope-empty' },
    '9': { stage: 'PRE_PUSH', outcome: 'PASS', filesScanned: 100, totalViolations: 0, diagnosis: 'repo-clean' },
    ...overrides,
  },
});

test('analyzeConsumerMenuMatrixBaseline marca estable cuando no hay drift', () => {
  const roundA = buildRound();
  const roundB = buildRound();
  const analysis = analyzeConsumerMenuMatrixBaseline([roundA, roundB]);

  assert.equal(analysis.stable, true);
  assert.equal(analysis.byOption['1'].stable, true);
  assert.equal(analysis.byOption['2'].stable, true);
  assert.deepEqual(analysis.byOption['2'].driftFields, []);
});

test('analyzeConsumerMenuMatrixBaseline detecta drift por campo', () => {
  const roundA = buildRound();
  const roundB = buildRound({
    '2': {
      ...roundA.byOption['2'],
      totalViolations: 5,
    },
  });
  const analysis = analyzeConsumerMenuMatrixBaseline([roundA, roundB]);

  assert.equal(analysis.stable, false);
  assert.equal(analysis.byOption['2'].stable, false);
  assert.deepEqual(analysis.byOption['2'].driftFields, ['totalViolations']);
});

test('runConsumerMenuMatrixBaseline ejecuta N rondas con runner inyectado', async () => {
  let calls = 0;
  const runner = async (): Promise<ConsumerMenuMatrixReport> => {
    calls += 1;
    return buildRound();
  };

  const result = await runConsumerMenuMatrixBaseline({
    rounds: 2,
    runMatrix: runner,
  });

  assert.equal(calls, 2);
  assert.equal(result.rounds.length, 2);
  assert.equal(result.analysis.stable, true);
});

