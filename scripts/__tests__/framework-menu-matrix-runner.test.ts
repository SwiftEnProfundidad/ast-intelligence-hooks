import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MATRIX_MENU_OPTION_IDS,
  type ConsumerMenuMatrixOptionReport,
  type MatrixOptionId,
} from '../framework-menu-matrix-evidence-lib';
import { runConsumerMenuMatrix } from '../framework-menu-matrix-runner-lib';

const buildOptionReport = (overrides: Partial<ConsumerMenuMatrixOptionReport> = {}): ConsumerMenuMatrixOptionReport => {
  return {
    stage: 'PRE_COMMIT',
    outcome: 'PASS',
    filesScanned: 10,
    totalViolations: 0,
    diagnosis: 'repo-clean',
    ...overrides,
  };
};

test('runConsumerMenuMatrix ejecuta 1/2/3/4/9/11–14 y devuelve contrato mínimo por opción', async () => {
  const gates: string[] = [];
  const result = await runConsumerMenuMatrix({
    repoRoot: process.cwd(),
    dependencies: {
      runRepoGateSilent: async () => {
        gates.push(gates.some((entry) => entry === '1') ? '14' : '1');
      },
      runRepoAndStagedPrePushGateSilent: async () => {
        gates.push('2');
      },
      runStagedGateSilent: async () => {
        gates.push(gates.some((entry) => entry === '3') ? '11' : '3');
      },
      runUnstagedGateSilent: async () => {
        gates.push('12');
      },
      runWorkingTreeGateSilent: async () => {
        gates.push('13');
      },
      runWorkingTreePrePushGateSilent: async () => {
        gates.push('4');
      },
      readMatrixOptionReport: (_repoRoot: string, optionId: MatrixOptionId) =>
        buildOptionReport({
          stage: optionId === '2' || optionId === '4' || optionId === '9' ? 'PRE_PUSH' : 'PRE_COMMIT',
          outcome: 'PASS',
          filesScanned: 10,
          totalViolations: 0,
          diagnosis: 'repo-clean',
        }),
    },
  });

  assert.deepEqual(gates, ['1', '2', '3', '4', '11', '12', '13', '14']);
  assert.deepEqual(Object.keys(result.byOption), [...MATRIX_MENU_OPTION_IDS]);

  for (const optionId of MATRIX_MENU_OPTION_IDS) {
    const option = result.byOption[optionId];
    assert.ok(option, `Expected option ${optionId} report`);
    assert.equal(typeof option.stage, 'string');
    assert.equal(typeof option.outcome, 'string');
    assert.equal(typeof option.filesScanned, 'number');
    assert.equal(typeof option.totalViolations, 'number');
    assert.equal(typeof option.diagnosis, 'string');
  }
});

test('runConsumerMenuMatrix mantiene contrato determinista ante fallo de una opción (sad path)', async () => {
  const calls: string[] = [];
  const reportsByOption: Record<MatrixOptionId, ConsumerMenuMatrixOptionReport> = {
    '1': buildOptionReport({ stage: 'PRE_COMMIT', diagnosis: 'repo-clean' }),
    '2': buildOptionReport({ stage: 'PRE_PUSH', diagnosis: 'violations-detected', totalViolations: 2 }),
    '3': buildOptionReport({ stage: 'PRE_COMMIT', diagnosis: 'scope-empty', filesScanned: 0 }),
    '4': buildOptionReport({ stage: 'PRE_PUSH', diagnosis: 'scope-empty', filesScanned: 0 }),
    '9': buildOptionReport({ stage: 'PRE_PUSH', diagnosis: 'repo-clean' }),
    '11': buildOptionReport({ stage: 'PRE_COMMIT', diagnosis: 'scope-empty', filesScanned: 0 }),
    '12': buildOptionReport({ stage: 'PRE_COMMIT', diagnosis: 'repo-clean' }),
    '13': buildOptionReport({ stage: 'PRE_COMMIT', diagnosis: 'repo-clean' }),
    '14': buildOptionReport({ stage: 'PRE_COMMIT', diagnosis: 'repo-clean' }),
  };

  const result = await runConsumerMenuMatrix({
    repoRoot: process.cwd(),
    dependencies: {
      runRepoGateSilent: async () => {
        calls.push(calls.some((entry) => entry === '1') ? '14' : '1');
      },
      runRepoAndStagedPrePushGateSilent: async () => {
        calls.push('2');
        throw new Error('option-2-failure');
      },
      runStagedGateSilent: async () => {
        calls.push(calls.some((entry) => entry === '3') ? '11' : '3');
      },
      runUnstagedGateSilent: async () => {
        calls.push('12');
      },
      runWorkingTreeGateSilent: async () => {
        calls.push('13');
      },
      runWorkingTreePrePushGateSilent: async () => {
        calls.push('4');
      },
      readMatrixOptionReport: (_repoRoot: string, optionId: MatrixOptionId) => reportsByOption[optionId],
    },
  });

  assert.deepEqual(calls, ['1', '2', '3', '4', '11', '12', '13', '14']);
  assert.equal(result.byOption['1'].diagnosis, 'repo-clean');
  assert.equal(result.byOption['2'].diagnosis, 'unknown');
  assert.equal(result.byOption['2'].stage, 'UNKNOWN');
  assert.equal(result.byOption['3'].diagnosis, 'scope-empty');
  assert.equal(result.byOption['4'].stage, 'PRE_PUSH');
  assert.equal(result.byOption['9'].diagnosis, 'repo-clean');
  assert.equal(result.byOption['11'].diagnosis, 'scope-empty');
  assert.equal(result.byOption['12'].diagnosis, 'repo-clean');
});
