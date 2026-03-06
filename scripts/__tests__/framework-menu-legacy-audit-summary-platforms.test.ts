import assert from 'node:assert/strict';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';
import {
  writeEvidenceIosAndroidOnlyFixture,
  writeEvidenceMixedRepoHeuristicFixture,
  writeEvidenceRuleIdMappedFixture,
  writeEvidenceSnapshotPlatformsFixture,
  writeEvidenceTsHeuristicMappedFixture,
} from './framework-menu-legacy-audit-summary-test-helpers';

test('readLegacyAuditSummary mantiene siempre las 5 plataformas con cero cuando no hay findings', async () => {
  await withTempDir('pumuki-legacy-audit-platforms-', async (repoRoot) => {
    writeEvidenceIosAndroidOnlyFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    assert.equal(summary.platforms.length, 5);
    const backend = summary.platforms.find((platform) => platform.platform === 'Backend');
    const frontend = summary.platforms.find((platform) => platform.platform === 'Frontend');
    assert.ok(backend);
    assert.ok(frontend);
    assert.equal(backend?.bySeverity.CRITICAL, 0);
    assert.equal(backend?.bySeverity.HIGH, 0);
    assert.equal(backend?.bySeverity.MEDIUM, 0);
    assert.equal(backend?.bySeverity.LOW, 0);
    assert.equal(frontend?.bySeverity.CRITICAL, 0);
    assert.equal(frontend?.bySeverity.HIGH, 0);
    assert.equal(frontend?.bySeverity.MEDIUM, 0);
    assert.equal(frontend?.bySeverity.LOW, 0);
  });
});

test('readLegacyAuditSummary clasifica plataforma por ruleId cuando el path no pertenece a apps', async () => {
  await withTempDir('pumuki-legacy-audit-ruleid-platform-', async (repoRoot) => {
    writeEvidenceRuleIdMappedFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    const backend = summary.platforms.find((platform) => platform.platform === 'Backend');
    const other = summary.platforms.find((platform) => platform.platform === 'Other');
    assert.ok(backend);
    assert.ok(other);
    assert.equal(backend?.filesAffected, 1);
    assert.equal(backend?.topViolations[0]?.ruleId, 'skills.backend.no-empty-catch');
    assert.equal(other?.filesAffected, 0);
  });
});

test('readLegacyAuditSummary clasifica heuristics.ts a frontend y backend en repos framework', async () => {
  await withTempDir('pumuki-legacy-audit-ts-heuristic-platform-', async (repoRoot) => {
    writeEvidenceTsHeuristicMappedFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    const backend = summary.platforms.find((platform) => platform.platform === 'Backend');
    const frontend = summary.platforms.find((platform) => platform.platform === 'Frontend');
    const other = summary.platforms.find((platform) => platform.platform === 'Other');
    assert.ok(backend);
    assert.ok(frontend);
    assert.ok(other);
    assert.equal(backend?.filesAffected, 1);
    assert.equal(frontend?.filesAffected, 1);
    assert.equal(other?.filesAffected, 0);
  });
});

test('readLegacyAuditSummary en repo mixto prioriza path apps/* frente a fallback heuristics.ts.*', async () => {
  await withTempDir('pumuki-legacy-audit-mixed-repo-', async (repoRoot) => {
    writeEvidenceMixedRepoHeuristicFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    const backend = summary.platforms.find((platform) => platform.platform === 'Backend');
    const frontend = summary.platforms.find((platform) => platform.platform === 'Frontend');
    const other = summary.platforms.find((platform) => platform.platform === 'Other');

    assert.ok(backend);
    assert.ok(frontend);
    assert.ok(other);
    assert.equal(backend?.filesAffected, 1);
    assert.equal(frontend?.filesAffected, 1);
    assert.equal(other?.filesAffected, 0);
  });
});

test('readLegacyAuditSummary prioriza snapshot.platforms cuando existe en evidencia', async () => {
  await withTempDir('pumuki-legacy-audit-snapshot-platforms-', async (repoRoot) => {
    writeEvidenceSnapshotPlatformsFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);

    const ios = summary.platforms.find((platform) => platform.platform === 'iOS');
    const other = summary.platforms.find((platform) => platform.platform === 'Other');
    assert.ok(ios);
    assert.ok(other);
    assert.equal(ios?.filesAffected, 2);
    assert.equal(ios?.bySeverity.CRITICAL, 1);
    assert.equal(ios?.bySeverity.HIGH, 1);
    assert.equal(other?.filesAffected, 1);
    assert.equal(other?.bySeverity.MEDIUM, 1);
  });
});
