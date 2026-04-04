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
