import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { readEvidenceSummaryForMenu } from '../framework-menu-evidence-summary-lib';

test('readEvidenceSummaryForMenu devuelve estado missing cuando no existe .ai_evidence.json', async () => {
  await withTempDir('pumuki-menu-evidence-missing-', async (repoRoot) => {
    const summary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(summary.status, 'missing');
    assert.equal(summary.totalFindings, 0);
    assert.equal(summary.filesScanned, 0);
    assert.equal(summary.filesAffected, 0);
    assert.deepEqual(summary.topFiles, []);
    assert.deepEqual(summary.topFileLocations, []);
    assert.deepEqual(summary.topFindings, []);
  });
});

test('readEvidenceSummaryForMenu devuelve estado invalid cuando el JSON es corrupto', async () => {
  await withTempDir('pumuki-menu-evidence-invalid-', async (repoRoot) => {
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{broken', 'utf8');
    const summary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(summary.status, 'invalid');
    assert.equal(summary.totalFindings, 0);
    assert.equal(summary.filesScanned, 0);
    assert.equal(summary.filesAffected, 0);
  });
});

test('readEvidenceSummaryForMenu orquesta lectura, normalización y severidades', async () => {
  await withTempDir('pumuki-menu-evidence-ok-', async (repoRoot) => {
    const evidence = {
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'BLOCKED',
        files_scanned: 12,
        files_affected: 2,
        findings: [
          { ruleId: 'rule.a', file: join(repoRoot, 'apps', 'backend', 'src', 'a.ts'), lines: [14, 16], severity: 'ERROR' },
          { ruleId: 'rule.a', file: join(repoRoot, 'apps', 'backend', 'src', 'a.ts'), lines: [7], severity: 'ERROR' },
          { ruleId: 'rule.b', file: 'apps/web/src/view.tsx', lines: 21, severity: 'WARN' },
        ],
      },
      severity_metrics: {
        by_enterprise_severity: {
          CRITICAL: 0,
          HIGH: 2,
          MEDIUM: 1,
          LOW: 0,
        },
      },
    };
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const summary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(summary.status, 'ok');
    assert.equal(summary.stage, 'PRE_COMMIT');
    assert.equal(summary.outcome, 'BLOCKED');
    assert.equal(summary.totalFindings, 3);
    assert.equal(summary.filesScanned, 12);
    assert.equal(summary.filesAffected, 2);
    assert.deepEqual(summary.bySeverity, {
      CRITICAL: 0,
      ERROR: 2,
      WARN: 1,
      INFO: 0,
    });
    assert.deepEqual(summary.byEnterpriseSeverity, {
      CRITICAL: 0,
      HIGH: 2,
      MEDIUM: 1,
      LOW: 0,
    });
    assert.deepEqual(summary.topFiles, [
      { file: 'apps/backend/src/a.ts', count: 2 },
      { file: 'apps/web/src/view.tsx', count: 1 },
    ]);
    assert.deepEqual(summary.topFileLocations, [
      { file: 'apps/backend/src/a.ts', line: 7 },
      { file: 'apps/web/src/view.tsx', line: 21 },
    ]);
    assert.deepEqual(summary.topFindings, [
      { severity: 'HIGH', ruleId: 'rule.a', file: 'apps/backend/src/a.ts', line: 7 },
      { severity: 'HIGH', ruleId: 'rule.a', file: 'apps/backend/src/a.ts', line: 14 },
      { severity: 'MEDIUM', ruleId: 'rule.b', file: 'apps/web/src/view.tsx', line: 21 },
    ]);
  });
});

test('readEvidenceSummaryForMenu expone filas de plataforma cuando snapshot.platforms existe', async () => {
  await withTempDir('pumuki-menu-evidence-platforms-', async (repoRoot) => {
    const evidence = {
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'PASS',
        files_scanned: 3,
        files_affected: 1,
        findings: [],
        platforms: [
          {
            platform: 'iOS',
            files_affected: 1,
            by_severity: { CRITICAL: 0, HIGH: 1, MEDIUM: 0, LOW: 0 },
            top_violations: [],
          },
          {
            platform: 'Other',
            files_affected: 0,
            by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
            top_violations: [],
          },
        ],
      },
    };
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const summary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(summary.status, 'ok');
    assert.deepEqual(summary.platformAuditRows, [
      { platform: 'iOS', violations: 1 },
      { platform: 'Other', violations: 0 },
    ]);
  });
});

test('readEvidenceSummaryForMenu respeta topFindingsLimit', async () => {
  await withTempDir('pumuki-menu-evidence-limit-', async (repoRoot) => {
    const findings = Array.from({ length: 20 }, (_, index) => ({
      ruleId: `rule.${index}`,
      file: `src/f${index}.ts`,
      lines: 1,
      severity: 'WARN',
    }));
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'WARN',
            files_scanned: 20,
            files_affected: 20,
            findings,
          },
        },
        null,
        2
      ),
      'utf8'
    );

    const defaultSummary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(defaultSummary.topFindings.length, 10);

    const wide = readEvidenceSummaryForMenu(repoRoot, { topFindingsLimit: 3 });
    assert.equal(wide.topFindings.length, 3);
  });
});
