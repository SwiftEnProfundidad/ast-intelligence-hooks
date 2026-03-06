import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { exportLegacyAuditMarkdown } from '../framework-menu-legacy-audit-lib';
import { formatLegacyAuditReport } from '../framework-menu-legacy-audit-render';
import { buildLegacyAuditMarkdownDocument } from '../framework-menu-legacy-audit-markdown-document';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';
import { writeLegacyAuditEvidenceFixture } from './framework-menu-legacy-audit-render-test-helpers';

test('buildLegacyAuditMarkdownDocument compone snapshot, links y panel legacy', async () => {
  await withTempDir('pumuki-legacy-audit-document-', async (repoRoot) => {
    writeLegacyAuditEvidenceFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const markdown = buildLegacyAuditMarkdownDocument(summary);

    assert.match(markdown, /# PUMUKI Audit Report/);
    assert.match(markdown, /## Snapshot/);
    assert.match(markdown, /## Clickable Top Files/);
    assert.match(markdown, /## Clickable Findings/);
    assert.match(markdown, /## Legacy Panel/);
    assert.match(markdown, /FINAL SUMMARY — VIOLATIONS BY SEVERITY/);
  });
});

test('exportLegacyAuditMarkdown genera reporte markdown en .audit-reports', async () => {
  await withTempDir('pumuki-legacy-audit-export-', async (repoRoot) => {
    writeLegacyAuditEvidenceFixture(repoRoot);
    const outputDir = join(repoRoot, '.audit-reports');
    mkdirSync(outputDir, { recursive: true });

    const filePath = exportLegacyAuditMarkdown({
      repoRoot,
      outputPath: join(outputDir, 'legacy-audit.md'),
    });

    assert.equal(existsSync(filePath), true);
    const markdown = readFileSync(filePath, 'utf8');
    assert.match(markdown, /# PUMUKI Audit Report/);
    assert.match(markdown, /## Clickable Top Files/);
    assert.match(markdown, /## Clickable Findings/);
    assert.match(
      markdown,
      /\[apps\/ios\/App\/Feature\.swift:18\]\(\.\/apps\/ios\/App\/Feature\.swift#L18\)/
    );
    assert.match(markdown, /FINAL SUMMARY — VIOLATIONS BY SEVERITY/);
  });
});

test('formatLegacyAuditReport devuelve mensaje claro cuando falta o falla evidencia', async () => {
  await withTempDir('pumuki-legacy-audit-empty-', async (repoRoot) => {
    assert.equal(
      formatLegacyAuditReport(readLegacyAuditSummary(repoRoot)),
      'No .ai_evidence.json found. Run an audit option first.'
    );

    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{bad json', 'utf8');
    assert.equal(
      formatLegacyAuditReport(readLegacyAuditSummary(repoRoot)),
      '.ai_evidence.json is invalid. Regenerate evidence and retry.'
    );
  });
});
