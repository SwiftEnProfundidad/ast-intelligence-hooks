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

test('readEvidenceSummaryForMenu agrega severidades y top de ficheros', async () => {
  await withTempDir('pumuki-menu-evidence-ok-', async (repoRoot) => {
    const evidence = {
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'BLOCKED',
        findings: [
          { file: 'apps/backend/src/a.ts', severity: 'ERROR' },
          { file: 'apps/backend/src/a.ts', severity: 'ERROR' },
          { file: 'apps/ios/App/Feature.swift', severity: 'CRITICAL' },
          { file: 'apps/web/src/view.tsx', severity: 'WARN' },
        ],
      },
    };
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const summary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(summary.status, 'ok');
    assert.equal(summary.stage, 'PRE_COMMIT');
    assert.equal(summary.outcome, 'BLOCKED');
    assert.equal(summary.totalFindings, 4);
    assert.deepEqual(summary.bySeverity, {
      CRITICAL: 1,
      ERROR: 2,
      WARN: 1,
      INFO: 0,
    });
    assert.deepEqual(summary.byEnterpriseSeverity, {
      CRITICAL: 1,
      HIGH: 2,
      MEDIUM: 1,
      LOW: 0,
    });
    assert.deepEqual(summary.topFiles, [
      { file: 'apps/backend/src/a.ts', count: 2 },
      { file: 'apps/ios/App/Feature.swift', count: 1 },
      { file: 'apps/web/src/view.tsx', count: 1 },
    ]);
  });
});

test('readEvidenceSummaryForMenu normaliza topFiles absolutos a repo-relative', async () => {
  await withTempDir('pumuki-menu-evidence-absolute-paths-', async (repoRoot) => {
    const absoluteFile = join(repoRoot, 'apps', 'backend', 'src', 'runtime', 'process.ts');
    const evidence = {
      snapshot: {
        stage: 'PRE_COMMIT',
        outcome: 'BLOCKED',
        findings: [
          { file: absoluteFile, severity: 'ERROR' },
          { file: absoluteFile, severity: 'ERROR' },
        ],
      },
    };
    writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(evidence, null, 2), 'utf8');

    const summary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(summary.status, 'ok');
    assert.deepEqual(summary.topFiles, [
      { file: 'apps/backend/src/runtime/process.ts', count: 2 },
    ]);
  });
});
