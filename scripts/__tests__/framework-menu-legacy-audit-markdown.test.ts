import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { exportLegacyAuditMarkdown } from '../framework-menu-legacy-audit-lib';
import { formatLegacyAuditReport, formatLegacyFileDiagnostics } from '../framework-menu-legacy-audit-render';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const writeEvidenceFixture = (repoRoot: string): void => {
  const payload = {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'ios.quality.long-function',
          severity: 'CRITICAL',
          filePath: 'apps/ios/App/Feature.swift',
          lines: [18, 22],
        },
        {
          ruleId: 'backend.avoid-explicit-any',
          severity: 'ERROR',
          filePath: 'apps/backend/src/domain/service.ts',
          lines: 44,
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 1,
        ERROR: 1,
        WARN: 0,
        INFO: 0,
      },
    },
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

const writeEvidenceAbsolutePathsFixture = (repoRoot: string): void => {
  const payload = {
    version: '2.1',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'BLOCK',
      findings: [
        {
          ruleId: 'skills.backend.no-empty-catch',
          severity: 'CRITICAL',
          filePath: `${repoRoot}/apps/backend/src/runtime/process.ts`,
          lines: 27,
        },
        {
          ruleId: 'skills.frontend.avoid-explicit-any',
          severity: 'ERROR',
          filePath: `${repoRoot}/apps/web/src/ui/banner.tsx`,
          lines: [14, 22],
        },
      ],
    },
    severity_metrics: {
      by_severity: {
        CRITICAL: 1,
        ERROR: 1,
        WARN: 0,
        INFO: 0,
      },
    },
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(payload, null, 2), 'utf8');
};

test('exportLegacyAuditMarkdown genera reporte markdown en .audit-reports', async () => {
  await withTempDir('pumuki-legacy-audit-export-', async (repoRoot) => {
    writeEvidenceFixture(repoRoot);
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

test('menu\/export normalizan paths absolutos a repo-relative para trazabilidad clicable consistente', async () => {
  await withTempDir('pumuki-legacy-audit-absolute-paths-', async (repoRoot) => {
    writeEvidenceAbsolutePathsFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const diagnostics = formatLegacyFileDiagnostics(summary);

    assert.match(diagnostics, /apps\/backend\/src\/runtime\/process\.ts:27/);
    assert.match(diagnostics, /apps\/web\/src\/ui\/banner\.tsx:14/);
    assert.doesNotMatch(diagnostics, new RegExp(escapeRegExp(repoRoot)));

    const outputPath = exportLegacyAuditMarkdown({
      repoRoot,
      outputPath: join(repoRoot, '.audit-reports', 'legacy-absolute-paths.md'),
    });
    const markdown = readFileSync(outputPath, 'utf8');

    assert.match(
      markdown,
      /\[apps\/backend\/src\/runtime\/process\.ts:27\]\(\.\/apps\/backend\/src\/runtime\/process\.ts#L27\)/
    );
    assert.match(
      markdown,
      /\[apps\/web\/src\/ui\/banner\.tsx:14\]\(\.\/apps\/web\/src\/ui\/banner\.tsx#L14\)/
    );
    assert.doesNotMatch(markdown, new RegExp(escapeRegExp(repoRoot)));
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
