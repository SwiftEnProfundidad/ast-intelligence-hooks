import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  parsePhase5BlockersReadinessArgs,
  readPhase5BlockersReadinessInput,
} from '../phase5-blockers-readiness-cli-lib';

test('parsePhase5BlockersReadinessArgs applies deterministic defaults', () => {
  const parsed = parsePhase5BlockersReadinessArgs([]);

  assert.deepEqual(parsed, {
    adapterReportFile: '.audit-reports/adapter/adapter-real-session-report.md',
    consumerTriageReportFile: '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
    outFile: '.audit-reports/phase5/phase5-blockers-readiness.md',
    requireAdapterReport: false,
  });
});

test('parsePhase5BlockersReadinessArgs validates unknown arguments', () => {
  assert.throws(
    () => parsePhase5BlockersReadinessArgs(['--unknown']),
    /Unknown argument: --unknown/
  );
});

test('readPhase5BlockersReadinessInput returns missing and present states', async () => {
  await withTempDir('pumuki-phase5-blockers-cli-', (tempRoot) => {
    const missing = readPhase5BlockersReadinessInput(
      tempRoot,
      '.audit-reports/phase5/phase5-blockers-readiness.md'
    );
    assert.equal(missing.exists, false);

    const target = join(tempRoot, '.audit-reports/phase5/phase5-blockers-readiness.md');
    mkdirSync(join(tempRoot, '.audit-reports/phase5'), { recursive: true });
    writeFileSync(target, '# blockers', 'utf8');

    const present = readPhase5BlockersReadinessInput(
      tempRoot,
      '.audit-reports/phase5/phase5-blockers-readiness.md'
    );
    assert.equal(present.exists, true);
    assert.equal(present.content, '# blockers');
  });
});
