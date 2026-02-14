import assert from 'node:assert/strict';
import test from 'node:test';
import { parseConsumerCiArtifactsArgs } from '../collect-consumer-ci-artifacts-args-lib';

test('parseConsumerCiArtifactsArgs resolves defaults and required repo', () => {
  const options = parseConsumerCiArtifactsArgs(['--repo', 'org/repo']);
  assert.equal(options.repo, 'org/repo');
  assert.equal(options.limit, 20);
  assert.equal(
    options.outFile,
    '.audit-reports/consumer-triage/consumer-ci-artifacts-report.md'
  );
});

test('parseConsumerCiArtifactsArgs parses explicit limit and out file', () => {
  const options = parseConsumerCiArtifactsArgs([
    '--repo',
    'org/repo',
    '--limit',
    '42',
    '--out',
    'reports/output.md',
  ]);

  assert.equal(options.limit, 42);
  assert.equal(options.outFile, 'reports/output.md');
});

test('parseConsumerCiArtifactsArgs rejects missing required repo argument', () => {
  assert.throws(
    () => parseConsumerCiArtifactsArgs([]),
    /Missing required argument --repo/
  );
});

test('parseConsumerCiArtifactsArgs rejects invalid limit value', () => {
  assert.throws(
    () => parseConsumerCiArtifactsArgs(['--repo', 'org/repo', '--limit', '0']),
    /Invalid --limit value/
  );
});
