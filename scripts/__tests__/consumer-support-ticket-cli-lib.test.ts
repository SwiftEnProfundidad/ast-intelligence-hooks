import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  parseConsumerSupportTicketArgs,
  resolveRequiredConsumerSupportTicketFile,
} from '../consumer-support-ticket-cli-lib';

test('parseConsumerSupportTicketArgs applies deterministic defaults', () => {
  const parsed = parseConsumerSupportTicketArgs([]);

  assert.deepEqual(parsed, {
    repo: 'owner/repo',
    supportBundleFile: '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
    authReportFile: '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
    outFile: '.audit-reports/consumer-triage/consumer-support-ticket-draft.md',
  });
});

test('parseConsumerSupportTicketArgs validates unknown arguments', () => {
  assert.throws(
    () => parseConsumerSupportTicketArgs(['--unknown']),
    /Unknown argument: --unknown/
  );
});

test('resolveRequiredConsumerSupportTicketFile resolves existing file and fails when missing', async () => {
  await withTempDir('pumuki-consumer-support-ticket-cli-', (tempRoot) => {
    assert.throws(
      () =>
        resolveRequiredConsumerSupportTicketFile(
          tempRoot,
          '.audit-reports/consumer-triage/consumer-ci-auth-check.md'
        ),
      /Input file not found/
    );

    const target = join(tempRoot, '.audit-reports/consumer-triage/consumer-ci-auth-check.md');
    mkdirSync(join(tempRoot, '.audit-reports/consumer-triage'), { recursive: true });
    writeFileSync(target, '# auth', 'utf8');

    const resolved = resolveRequiredConsumerSupportTicketFile(
      tempRoot,
      '.audit-reports/consumer-triage/consumer-ci-auth-check.md'
    );
    assert.equal(resolved, target);
  });
});
