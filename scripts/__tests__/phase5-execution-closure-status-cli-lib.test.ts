import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  parsePhase5ExecutionClosureStatusArgs,
  readPhase5ExecutionClosureStatusInput,
} from '../phase5-execution-closure-status-cli-lib';

test('parsePhase5ExecutionClosureStatusArgs applies deterministic defaults', () => {
  const parsed = parsePhase5ExecutionClosureStatusArgs([]);

  assert.deepEqual(parsed, {
    phase5BlockersReportFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
    consumerUnblockReportFile: '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    adapterReadinessReportFile: '.audit-reports/adapter/adapter-readiness.md',
    outFile: '.audit-reports/phase5/phase5-execution-closure-status.md',
    requireAdapterReadiness: false,
  });
});

test('parsePhase5ExecutionClosureStatusArgs validates unknown arguments', () => {
  assert.throws(
    () => parsePhase5ExecutionClosureStatusArgs(['--unknown']),
    /Unknown argument: --unknown/
  );
});

test('readPhase5ExecutionClosureStatusInput returns missing and present states', async () => {
  await withTempDir('pumuki-phase5-closure-status-cli-', (tempRoot) => {
    const missing = readPhase5ExecutionClosureStatusInput(
      tempRoot,
      '.audit-reports/phase5/phase5-blockers-readiness.md'
    );
    assert.equal(missing.exists, false);

    const target = join(tempRoot, '.audit-reports/phase5/phase5-blockers-readiness.md');
    mkdirSync(join(tempRoot, '.audit-reports/phase5'), { recursive: true });
    writeFileSync(target, '# blockers', 'utf8');

    const present = readPhase5ExecutionClosureStatusInput(
      tempRoot,
      '.audit-reports/phase5/phase5-blockers-readiness.md'
    );
    assert.equal(present.exists, true);
    assert.equal(present.content, '# blockers');
  });
});
