import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLegacyAuditMarkdownDocument } from './framework-menu-legacy-audit-markdown-document';
import { readLegacyAuditSummary } from './framework-menu-legacy-audit-summary';

export const exportLegacyAuditMarkdown = (params?: {
  repoRoot?: string;
  outputPath?: string;
}): string => {
  const repoRoot = params?.repoRoot ?? process.cwd();
  const summary = readLegacyAuditSummary(repoRoot);
  const outputPath = params?.outputPath
    ?? join(repoRoot, '.audit-reports', 'pumuki-legacy-audit.md');
  mkdirSync(join(outputPath, '..'), { recursive: true });

  const markdown = buildLegacyAuditMarkdownDocument(summary);
  writeFileSync(outputPath, markdown, 'utf8');
  return outputPath;
};
