import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBuildConsumerStartupTriageArgs } from '../build-consumer-startup-triage-args-lib';

test('parseBuildConsumerStartupTriageArgs resolves defaults', () => {
  const options = parseBuildConsumerStartupTriageArgs(['--repo', 'owner/repo']);

  assert.equal(options.repo, 'owner/repo');
  assert.equal(options.limit, 20);
  assert.equal(options.outDir, '.audit-reports/consumer-triage');
  assert.equal(options.runWorkflowLint, true);
  assert.equal(options.includeAuthCheck, true);
  assert.equal(options.dryRun, false);
});

test('parseBuildConsumerStartupTriageArgs resolves optional flags', () => {
  const options = parseBuildConsumerStartupTriageArgs([
    '--repo',
    'owner/repo',
    '--limit',
    '8',
    '--out-dir',
    'reports/triage',
    '--repo-path',
    '/tmp/repo',
    '--actionlint-bin',
    '/tmp/actionlint',
    '--skip-workflow-lint',
    '--skip-auth-check',
    '--dry-run',
  ]);

  assert.equal(options.limit, 8);
  assert.equal(options.outDir, 'reports/triage');
  assert.equal(options.repoPath, '/tmp/repo');
  assert.equal(options.actionlintBin, '/tmp/actionlint');
  assert.equal(options.runWorkflowLint, false);
  assert.equal(options.includeAuthCheck, false);
  assert.equal(options.dryRun, true);
});
