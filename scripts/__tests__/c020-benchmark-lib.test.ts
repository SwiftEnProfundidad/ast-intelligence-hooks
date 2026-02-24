import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDefaultC020BenchmarkOptions,
  buildLegacyParityCommandArgs,
  parseC020BenchmarkArgs,
} from '../c020-benchmark-lib';

test('parseC020BenchmarkArgs usa defaults enterprise para C020', () => {
  const options = parseC020BenchmarkArgs([], buildDefaultC020BenchmarkOptions());
  assert.equal(options.strictScope, false);
  assert.equal(options.sddBypass, true);
  assert.equal(options.legacyBaselinePath, 'assets/benchmarks/legacy-baseline-precommit-v012.json');
  assert.equal(options.enterpriseEvidencePath, '.audit_tmp/c020-a/enterprise-menu1.json');
});

test('parseC020BenchmarkArgs aplica overrides y flags', () => {
  const options = parseC020BenchmarkArgs(
    [
      '--legacy=tmp/legacy.json',
      '--enterprise=tmp/enterprise.json',
      '--menu-log=tmp/menu.log',
      '--parity=tmp/parity.md',
      '--parity-log=tmp/parity.log',
      '--out-dir=tmp/out',
      '--strict-scope',
      '--no-sdd-bypass',
    ],
    buildDefaultC020BenchmarkOptions()
  );

  assert.equal(options.strictScope, true);
  assert.equal(options.sddBypass, false);
  assert.match(options.legacyBaselinePath, /tmp\/legacy\.json$/);
  assert.match(options.enterpriseEvidencePath, /tmp\/enterprise\.json$/);
  assert.match(options.menuLogPath, /tmp\/menu\.log$/);
  assert.match(options.parityReportPath, /tmp\/parity\.md$/);
  assert.match(options.parityLogPath, /tmp\/parity\.log$/);
  assert.match(options.outputDir, /tmp\/out$/);
});

test('buildLegacyParityCommandArgs habilita allow-scope-mismatch por default', () => {
  const defaultOptions = parseC020BenchmarkArgs([], buildDefaultC020BenchmarkOptions());
  const args = buildLegacyParityCommandArgs(defaultOptions);
  assert.ok(args.includes('--allow-scope-mismatch'));
});

test('buildLegacyParityCommandArgs quita allow-scope-mismatch en strict', () => {
  const options = parseC020BenchmarkArgs(['--strict-scope'], buildDefaultC020BenchmarkOptions());
  const args = buildLegacyParityCommandArgs(options);
  assert.equal(args.includes('--allow-scope-mismatch'), false);
});
