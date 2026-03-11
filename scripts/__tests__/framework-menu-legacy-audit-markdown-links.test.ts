import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import { exportLegacyAuditMarkdown } from '../framework-menu-legacy-audit-lib';
import { formatLegacyFileDiagnostics } from '../framework-menu-legacy-audit-render';
import { readLegacyAuditSummary } from '../framework-menu-legacy-audit-summary';
import {
  buildLegacyAuditTopFilesSection,
  buildLegacyAuditTopFindingsSection,
  normalizeLegacyAuditMarkdownPath,
  toLegacyAuditMarkdownFileLink,
} from '../framework-menu-legacy-audit-markdown-links';
import {
  escapeLegacyAuditRegExp,
  writeLegacyAuditAbsolutePathsFixture,
} from './framework-menu-legacy-audit-render-test-helpers';

test('normalizeLegacyAuditMarkdownPath normaliza barras y prefijo relativo', () => {
  assert.equal(
    normalizeLegacyAuditMarkdownPath('.\\apps\\backend\\src\\runtime\\process.ts'),
    './apps/backend/src/runtime/process.ts'.replace(/^\.\//, '')
  );
});

test('toLegacyAuditMarkdownFileLink genera enlace clicable estable', () => {
  assert.equal(
    toLegacyAuditMarkdownFileLink('apps/backend/src/runtime/process.ts', 27),
    '[apps/backend/src/runtime/process.ts:27](./apps/backend/src/runtime/process.ts#L27)'
  );
});

test('buildLegacyAuditTopFilesSection y buildLegacyAuditTopFindingsSection normalizan paths absolutos', async () => {
  await withTempDir('pumuki-legacy-audit-absolute-paths-', async (repoRoot) => {
    writeLegacyAuditAbsolutePathsFixture(repoRoot);
    const summary = readLegacyAuditSummary(repoRoot);
    const diagnostics = formatLegacyFileDiagnostics(summary);

    assert.match(diagnostics, /apps\/backend\/src\/runtime\/process\.ts:27/);
    assert.match(diagnostics, /apps\/web\/src\/ui\/banner\.tsx:14/);
    assert.doesNotMatch(diagnostics, new RegExp(escapeLegacyAuditRegExp(repoRoot)));

    const topFiles = buildLegacyAuditTopFilesSection(summary);
    const topFindings = buildLegacyAuditTopFindingsSection(summary);
    assert.match(topFiles, /\[apps\/backend\/src\/runtime\/process\.ts:27\]\(\.\/apps\/backend\/src\/runtime\/process\.ts#L27\)/);
    assert.match(topFindings, /\[CRITICAL\] skills\.backend\.no-empty-catch -> \[apps\/backend\/src\/runtime\/process\.ts:27\]\(\.\/apps\/backend\/src\/runtime\/process\.ts#L27\)/);

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
    assert.doesNotMatch(markdown, new RegExp(escapeLegacyAuditRegExp(repoRoot)));
  });
});
