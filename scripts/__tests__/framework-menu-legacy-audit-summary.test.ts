import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';
import { writeEvidenceFixture } from './framework-menu-legacy-audit-summary-test-helpers';

test('readLegacyAuditSummary devuelve summary missing cuando no existe evidencia', async () => {
  await withTempDir('pumuki-legacy-audit-missing-', async (repoRoot) => {
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.status, 'missing');
    assert.equal(summary.totalViolations, 0);
    assert.equal(summary.codeHealthScore, 100);
  });
});

test('readLegacyAuditSummary devuelve summary invalid cuando la evidencia esta corrupta', async () => {
  await withTempDir('pumuki-legacy-audit-invalid-', async (repoRoot) => {
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{not-json', 'utf8');
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.status, 'invalid');
    assert.equal(summary.totalViolations, 0);
    assert.equal(summary.codeHealthScore, 0);
  });
});

test('readLegacyAuditSummary resume findings, severidad y rulesets', async () => {
  await withTempDir('pumuki-legacy-audit-summary-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.status, 'ok');
    assert.equal(summary.stage, 'PRE_COMMIT');
    assert.equal(summary.outcome, 'BLOCK');
    assert.equal(summary.totalViolations, 4);
    assert.equal(summary.filesScanned, 4);
    assert.equal(summary.filesAffected, 4);
    assert.equal(summary.bySeverity.CRITICAL, 1);
    assert.equal(summary.bySeverity.HIGH, 1);
    assert.equal(summary.bySeverity.MEDIUM, 2);
    assert.equal(summary.rulesets.length > 0, true);
  });
});
