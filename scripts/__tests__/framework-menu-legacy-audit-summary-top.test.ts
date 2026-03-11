import assert from 'node:assert/strict';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';
import {
  writeEvidenceAbsolutePathsFixture,
  writeEvidenceFixture,
} from './framework-menu-legacy-audit-summary-test-helpers';

test('readLegacyAuditSummary normaliza paths absolutos a repo-relative', async () => {
  await withTempDir('pumuki-legacy-audit-absolute-paths-', async (repoRoot) => {
    writeEvidenceAbsolutePathsFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.topFindings?.[0]?.file.startsWith(repoRoot), false);
    assert.equal(summary.topFiles[0]?.file.startsWith(repoRoot), false);
  });
});

test('readLegacyAuditSummary ordena top violations, top files y top findings', async () => {
  await withTempDir('pumuki-legacy-audit-top-ranked-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.topViolations[0]?.ruleId, 'android.no-thread-sleep');
    assert.equal(summary.topViolations[0]?.count, 1);
    assert.equal(summary.topFiles.length, 4);
    assert.equal(summary.topFindings?.[0]?.severity, 'CRITICAL');
    assert.equal(summary.topFindings?.[0]?.line, 18);
  });
});
