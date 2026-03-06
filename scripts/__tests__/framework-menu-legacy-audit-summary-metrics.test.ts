import assert from 'node:assert/strict';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';
import {
  writeEvidenceFixture,
  writeEvidenceWithFileMetricsFixture,
  writeEvidenceWithFilesScannedFixture,
} from './framework-menu-legacy-audit-summary-test-helpers';

test('readLegacyAuditSummary usa snapshot.files_scanned y score por densidad de violaciones', async () => {
  await withTempDir('pumuki-legacy-audit-files-scanned-', async (repoRoot) => {
    writeEvidenceWithFilesScannedFixture(repoRoot, 200);
    const relaxed = readLegacyAuditSummary(repoRoot);
    writeEvidenceWithFilesScannedFixture(repoRoot, 1);
    const strict = readLegacyAuditSummary(repoRoot);

    assert.equal(relaxed.filesScanned, 200);
    assert.equal(strict.filesScanned, 1);
    assert.ok(relaxed.codeHealthScore > strict.codeHealthScore);
  });
});

test('readLegacyAuditSummary separa snapshot.files_scanned de snapshot.files_affected', async () => {
  await withTempDir('pumuki-legacy-audit-file-metrics-', async (repoRoot) => {
    writeEvidenceWithFileMetricsFixture(repoRoot, 939, 40);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.filesScanned, 939);
    assert.equal(summary.filesAffected, 40);
  });
});

test('readLegacyAuditSummary resume pattern checks y eslint counts desde findings', async () => {
  await withTempDir('pumuki-legacy-audit-pattern-metrics-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.patternChecks.consoleLog, 1);
    assert.equal(summary.patternChecks.anyType, 1);
    assert.equal(summary.patternChecks.todoFixme, 0);
    assert.equal(summary.eslint.errors, 0);
    assert.equal(summary.eslint.warnings, 0);
  });
});
