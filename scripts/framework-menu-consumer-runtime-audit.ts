import {
  exportLegacyAuditMarkdown,
  formatLegacyAstBreakdown,
  formatLegacyAuditReport,
  formatLegacyEslintAudit,
  formatLegacyFileDiagnostics,
  formatLegacyPatternChecks,
  type LegacyAuditSummary,
  readLegacyAuditSummary,
  resolveLegacyPanelOuterWidth,
} from './framework-menu-legacy-audit-lib';
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
): LegacyAuditSummary => {
  const summary = readLegacyAuditSummary(dependencies.repoRoot);
  dependencies.write(`\n${formatLegacyAuditReport(summary, {
    panelWidth: resolveLegacyPanelOuterWidth(),
    color: dependencies.useColor(),
  })}\n`);
  return summary;
};

export const printConsumerRuntimeEmptyScopeHint = (
  dependencies: Pick<ConsumerRuntimeSummaryDependencies, 'write'>,
  summary: LegacyAuditSummary,
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
  summary: LegacyAuditSummary
): void => {
  if (summary.status !== 'ok') {
    return;
  }
  dependencies.emitNotification({
    event: {
      kind: 'audit.summary',
      totalViolations: summary.totalViolations,
      criticalViolations: summary.bySeverity.CRITICAL,
      highViolations: summary.bySeverity.HIGH,
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

export const exportConsumerRuntimeMarkdown = (repoRoot?: string): string =>
  exportLegacyAuditMarkdown(repoRoot);
