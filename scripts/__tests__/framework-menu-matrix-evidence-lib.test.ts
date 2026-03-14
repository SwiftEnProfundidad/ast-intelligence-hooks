import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { readMatrixOptionReport } from '../framework-menu-matrix-evidence-lib';

test('readMatrixOptionReport lee evidencia legacy y produce reporte por opcion', async () => {
  await withTempDir('framework-menu-matrix-evidence-', async (repoRoot) => {
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify({
      version: '2.1',
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'BLOCK',
        findings: [
          {
            ruleId: 'backend.avoid-explicit-any',
            severity: 'ERROR',
            filePath: 'apps/backend/src/service.ts',
          },
        ],
      },
      severity_metrics: {
        by_severity: {
          CRITICAL: 0,
          ERROR: 1,
          WARN: 0,
          INFO: 0,
        },
      },
    }, null, 2), 'utf8');

    const report = readMatrixOptionReport(repoRoot, '1');
    assert.equal(report.stage, 'PRE_COMMIT');
    assert.equal(report.outcome, 'BLOCK');
    assert.equal(report.totalViolations, 1);
    assert.equal(report.diagnosis, 'violations-detected');
  });
});
