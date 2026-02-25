import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  formatEvidenceSummaryForMenu,
  readEvidenceSummaryForMenu,
} from '../framework-menu-evidence-summary-lib';

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
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(evidence, null, 2),
      'utf8'
    );

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

test('formatEvidenceSummaryForMenu renderiza bloque operativo', () => {
  const rendered = formatEvidenceSummaryForMenu({
    status: 'ok',
    stage: 'CI',
    outcome: 'BLOCKED',
    totalFindings: 3,
    bySeverity: {
      CRITICAL: 1,
      ERROR: 1,
      WARN: 1,
      INFO: 0,
    },
    byEnterpriseSeverity: {
      CRITICAL: 1,
      HIGH: 1,
      MEDIUM: 1,
      LOW: 0,
    },
    topFiles: [
      { file: 'apps/backend/src/a.ts', count: 2 },
      { file: 'apps/ios/App/B.swift', count: 1 },
    ],
  });

  assert.match(rendered, /Evidence: status=ok stage=CI outcome=BLOCKED findings=3/);
  assert.match(rendered, /Severities \(enterprise\): critical=1 high=1 medium=1 low=0/);
  assert.match(rendered, /Top files: apps\/backend\/src\/a\.ts \(2\), apps\/ios\/App\/B\.swift \(1\)/);
});

test('formatEvidenceSummaryForMenu en missing da instruccion accionable', () => {
  const rendered = formatEvidenceSummaryForMenu({
    status: 'missing',
    stage: null,
    outcome: null,
    totalFindings: 0,
    bySeverity: {
      CRITICAL: 0,
      ERROR: 0,
      WARN: 0,
      INFO: 0,
    },
    byEnterpriseSeverity: {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    },
    topFiles: [],
  });

  assert.match(rendered, /Evidence: status=missing/);
  assert.match(rendered, /Run `npx --yes pumuki-pre-commit` to generate fresh evidence\./);
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
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      JSON.stringify(evidence, null, 2),
      'utf8'
    );

    const summary = readEvidenceSummaryForMenu(repoRoot);
    assert.equal(summary.status, 'ok');
    assert.deepEqual(summary.topFiles, [
      { file: 'apps/backend/src/runtime/process.ts', count: 2 },
    ]);
  });
});
