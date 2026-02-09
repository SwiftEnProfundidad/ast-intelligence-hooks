import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  parseConsumerStartupUnblockArgs,
  readConsumerStartupUnblockInput,
} from '../consumer-startup-unblock-cli-lib';

test('parseConsumerStartupUnblockArgs applies deterministic defaults', () => {
  const parsed = parseConsumerStartupUnblockArgs([]);

  assert.deepEqual(parsed, {
    repo: 'owner/repo',
    supportBundleFile: '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
    authReportFile: '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
    workflowLintReportFile: '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
    outFile: '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
  });
});

test('parseConsumerStartupUnblockArgs validates unknown arguments', () => {
  assert.throws(
    () => parseConsumerStartupUnblockArgs(['--unknown']),
    /Unknown argument: --unknown/
  );
});

test('readConsumerStartupUnblockInput returns missing and present states', async () => {
  await withTempDir('pumuki-consumer-unblock-cli-', (tempRoot) => {
    const missing = readConsumerStartupUnblockInput(
      tempRoot,
      '.audit-reports/consumer-triage/consumer-ci-auth-check.md'
    );
    assert.equal(missing.exists, false);

    const target = join(tempRoot, '.audit-reports/consumer-triage/consumer-ci-auth-check.md');
    mkdirSync(join(tempRoot, '.audit-reports/consumer-triage'), { recursive: true });
    writeFileSync(target, '# auth', 'utf8');

    const present = readConsumerStartupUnblockInput(
      tempRoot,
      '.audit-reports/consumer-triage/consumer-ci-auth-check.md'
    );
    assert.equal(present.exists, true);
    assert.equal(present.content, '# auth');
  });
});
