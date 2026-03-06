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
    assert.deepEqual(summary.topFiles, []);
  });
});

test('readEvidenceSummaryForMenu devuelve estado invalid cuando el JSON es corrupto', async () => {
  await withTempDir('pumuki-menu-evidence-invalid-', async (repoRoot) => {
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{broken', 'utf8');
    const summary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(summary.status, 'invalid');
    assert.equal(summary.totalFindings, 0);
  });
});

test('readEvidenceSummaryForMenu orquesta lectura, normalización y severidades', async () => {
  await withTempDir('pumuki-menu-evidence-ok-', async (repoRoot) => {
    const evidence = {
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'BLOCKED',
        findings: [
          { file: join(repoRoot, 'apps', 'backend', 'src', 'a.ts'), severity: 'ERROR' },
          { file: join(repoRoot, 'apps', 'backend', 'src', 'a.ts'), severity: 'ERROR' },
          { file: 'apps/web/src/view.tsx', severity: 'WARN' },
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
  });
});
