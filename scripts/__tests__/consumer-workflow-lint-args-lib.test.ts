import assert from 'node:assert/strict';
import test from 'node:test';
import { parseConsumerWorkflowLintArgs } from '../consumer-workflow-lint-args-lib';

test('parseConsumerWorkflowLintArgs applies deterministic defaults', () => {
  const parsed = parseConsumerWorkflowLintArgs(['--repo-path', '/tmp/repo']);

  assert.deepEqual(parsed, {
    repoPath: '/tmp/repo',
    outFile: '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
    actionlintBin: 'actionlint',
  });
});

test('parseConsumerWorkflowLintArgs validates required repo path', () => {
  assert.throws(
    () => parseConsumerWorkflowLintArgs([]),
    /Missing required argument --repo-path <path>/
  );
});

test('parseConsumerWorkflowLintArgs validates unknown arguments', () => {
  assert.throws(
    () => parseConsumerWorkflowLintArgs(['--repo-path', '/tmp/repo', '--unknown']),
    /Unknown argument: --unknown/
  );
});
