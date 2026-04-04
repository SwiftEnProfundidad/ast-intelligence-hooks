import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_DIRNAME,
  parseConsumerMenuMatrixBaselineArgs,
  resolveConsumerMenuMatrixBaselineOutputPaths,
} from '../consumer-menu-matrix-baseline-cli-lib';

test('parseConsumerMenuMatrixBaselineArgs aplica defaults estables', () => {
  const options = parseConsumerMenuMatrixBaselineArgs(
    ['--repo-root', '/tmp/fixtures/ios-architecture-showcase'],
    '/tmp/pumuki'
  );

  assert.equal(options.repoRoot, '/tmp/fixtures/ios-architecture-showcase');
  assert.equal(options.fixture, 'ios-architecture-showcase');
  assert.equal(options.rounds, 3);
  assert.equal(
    options.outDir,
    `/tmp/pumuki/.audit-reports/fixture-matrix/ios-architecture-showcase/${DEFAULT_CONSUMER_MENU_MATRIX_BASELINE_DIRNAME}`
  );
  assert.equal(options.printJson, false);
});

test('parseConsumerMenuMatrixBaselineArgs acepta configuración explícita', () => {
  const options = parseConsumerMenuMatrixBaselineArgs(
    [
      '--repo-root',
      '/tmp/fixtures/saas',
      '--fixture',
      'saas',
      '--rounds',
      '5',
      '--out-dir',
      'tmp/matrix',
      '--json',
    ],
    '/tmp/pumuki'
  );

  assert.equal(options.repoRoot, '/tmp/fixtures/saas');
  assert.equal(options.fixture, 'saas');
  assert.equal(options.rounds, 5);
  assert.equal(options.outDir, '/tmp/pumuki/tmp/matrix');
  assert.equal(options.printJson, true);
});

test('parseConsumerMenuMatrixBaselineArgs falla con rounds inválido', () => {
  assert.throws(
    () =>
      parseConsumerMenuMatrixBaselineArgs(
        ['--repo-root', '/tmp/fixtures/ios', '--rounds', '0'],
        '/tmp/pumuki'
      ),
    /Flag --rounds requires an integer greater than or equal to 1\./
  );
});

test('parseConsumerMenuMatrixBaselineArgs falla con argumentos desconocidos', () => {
  assert.throws(
    () => parseConsumerMenuMatrixBaselineArgs(['--unknown'], '/tmp/pumuki'),
    /Unknown argument: --unknown/
  );
});

test('resolveConsumerMenuMatrixBaselineOutputPaths devuelve report y summary estables', () => {
  const paths = resolveConsumerMenuMatrixBaselineOutputPaths('/tmp/matrix');

  assert.equal(paths.reportPath, '/tmp/matrix/report.json');
  assert.equal(paths.summaryPath, '/tmp/matrix/summary.md');
});
