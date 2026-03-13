import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatLegacyAstBreakdown,
  formatLegacyEslintAudit,
  formatLegacyFileDiagnostics,
  formatLegacyPatternChecks,
  readLegacyAuditSummary,
  renderLegacyPanel,
  resolveLegacyPanelOuterWidth,
} from './framework-menu-legacy-audit-lib';
import {
  formatEvidenceSummaryForMenu,
  readEvidenceSummaryForMenu,
  type FrameworkMenuEvidenceSummary,
} from './framework-menu-evidence-summary-lib';
import type {
  ConsumerRuntimeNotificationDependencies,
  ConsumerRuntimeScope,
  ConsumerRuntimeSummaryDependencies,
} from './framework-menu-consumer-runtime-types';

export const resolveConsumerRuntimeUseColor = (): boolean => {
  if (process.env.NO_COLOR === '1') {
    return false;
  }
  return process.stdout.isTTY === true;
};

export const renderConsumerRuntimeSummary = (
  dependencies: ConsumerRuntimeSummaryDependencies
): FrameworkMenuEvidenceSummary => {
  const summary = readEvidenceSummaryForMenu(dependencies.repoRoot);
  const lines = [
    formatEvidenceSummaryForMenu(summary),
    '',
    'Consumer runtime snapshot',
    `Files scanned: ${summary.filesScanned}`,
    `Files affected: ${summary.filesAffected}`,
  ];

  if (summary.topFiles.length > 0) {
    lines.push(
      'Top files',
      ...summary.topFiles.map((entry) => `- ${entry.file} (${entry.count})`)
    );
  }

  dependencies.write(`\n${renderLegacyPanel(lines, {
    width: resolveLegacyPanelOuterWidth(),
    color: dependencies.useColor(),
  })}\n`);
  return summary;
};

export const printConsumerRuntimeEmptyScopeHint = (
  dependencies: Pick<ConsumerRuntimeSummaryDependencies, 'write'>,
  summary: FrameworkMenuEvidenceSummary,
  scope: ConsumerRuntimeScope
): void => {
  if (summary.status !== 'ok' || summary.filesScanned > 0) {
    return;
  }
  if (scope === 'staged') {
    dependencies.write(
      '\nℹ Scope vacío (staged): no hay archivos staged para auditar. Resultado PASS por alcance vacío; usa 1 o 2 para validar repo completo.\n'
    );
    return;
  }
  dependencies.write(
    '\nℹ Scope vacío (working tree): no hay cambios sin commitear para auditar. Resultado PASS por alcance vacío; usa 1 o 2 para validar repo completo.\n'
  );
};

export const notifyConsumerRuntimeAuditSummary = (
  dependencies: ConsumerRuntimeNotificationDependencies,
  summary: FrameworkMenuEvidenceSummary
): void => {
  if (summary.status !== 'ok') {
    return;
  }
  const byEnterpriseSeverity = summary.byEnterpriseSeverity;
  dependencies.emitNotification({
    event: {
      kind: 'audit.summary',
      totalViolations: summary.totalFindings,
      criticalViolations: byEnterpriseSeverity?.CRITICAL ?? summary.bySeverity.CRITICAL,
      highViolations: byEnterpriseSeverity?.HIGH ?? summary.bySeverity.ERROR,
    },
    repoRoot: dependencies.repoRoot,
  });
};

export const renderConsumerRuntimePatternChecks = (repoRoot: string): string =>
  formatLegacyPatternChecks(readLegacyAuditSummary(repoRoot));

export const renderConsumerRuntimeEslintAudit = (repoRoot: string): string =>
  formatLegacyEslintAudit(readLegacyAuditSummary(repoRoot));

export const renderConsumerRuntimeAstBreakdown = (repoRoot: string): string =>
  formatLegacyAstBreakdown(readLegacyAuditSummary(repoRoot));

export const renderConsumerRuntimeFileDiagnostics = (repoRoot: string): string =>
  formatLegacyFileDiagnostics(readLegacyAuditSummary(repoRoot));

const buildClickableFindingsSection = (
  summary: FrameworkMenuEvidenceSummary
): string => {
  if (summary.topFindings.length === 0) {
    return '- none';
  }

  return summary.topFindings
    .map((finding) => {
      const safePath = encodeURI(finding.file.replace(/\\/g, '/').replace(/^\.\//, ''));
      return `- [${finding.severity}] ${finding.ruleId} -> [${finding.file}:${finding.line}](./${safePath}#L${finding.line})`;
    })
    .join('\n');
};

const buildClickableTopFilesSection = (
  summary: FrameworkMenuEvidenceSummary
): string => {
  if (summary.topFileLocations.length === 0) {
    return '- none';
  }

  return summary.topFileLocations
    .map((entry) => {
      const safePath = encodeURI(entry.file.replace(/\\/g, '/').replace(/^\.\//, ''));
      return `- [${entry.file}:${entry.line}](./${safePath}#L${entry.line})`;
    })
    .join('\n');
};

const buildConsumerRuntimeMarkdownDocument = (
  summary: FrameworkMenuEvidenceSummary
): string => {
  const stage = summary.stage ?? 'unknown';
  const outcome = summary.outcome ?? 'unknown';
  const byEnterpriseSeverity = summary.byEnterpriseSeverity;

  return [
    '# PUMUKI Audit Report',
    '',
    '## Snapshot',
    `- Stage: \`${stage}\``,
    `- Outcome: \`${outcome}\``,
    `- Total violations: \`${summary.totalFindings}\``,
    `- Files scanned: \`${summary.filesScanned}\``,
    `- Files affected: \`${summary.filesAffected}\``,
    `- Severity: \`CRITICAL ${byEnterpriseSeverity?.CRITICAL ?? summary.bySeverity.CRITICAL} | HIGH ${byEnterpriseSeverity?.HIGH ?? summary.bySeverity.ERROR} | MEDIUM ${byEnterpriseSeverity?.MEDIUM ?? summary.bySeverity.WARN} | LOW ${byEnterpriseSeverity?.LOW ?? summary.bySeverity.INFO}\``,
    '',
    '## Clickable Top Files',
    buildClickableTopFilesSection(summary),
    '',
    '## Clickable Findings',
    buildClickableFindingsSection(summary),
    '',
  ].join('\n');
};

export const exportConsumerRuntimeMarkdown = (repoRoot: string = process.cwd()): string => {
  const outputPath = join(repoRoot, '.audit-reports', 'pumuki-legacy-audit.md');
  mkdirSync(join(outputPath, '..'), { recursive: true });
  writeFileSync(outputPath, buildConsumerRuntimeMarkdownDocument(readEvidenceSummaryForMenu(repoRoot)), 'utf8');
  return outputPath;
};
