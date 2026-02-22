import { createConsumerLegacyMenuActions } from './framework-menu-consumer-actions-lib';
import {
  formatConsumerPreflight,
  runConsumerPreflight,
} from './framework-menu-consumer-preflight-lib';
import {
  exportLegacyAuditMarkdown,
  formatLegacyAstBreakdown,
  formatLegacyAuditReport,
  formatLegacyFileDiagnostics,
  formatLegacyEslintAudit,
  formatLegacyPatternChecks,
  type LegacyAuditSummary,
  readLegacyAuditSummary,
  renderLegacyPanel,
  resolveLegacyPanelOuterWidth,
} from './framework-menu-legacy-audit-lib';
import { resolveConsumerMenuLayout } from './framework-menu-layout-lib';
import {
  buildCliDesignTokens,
  renderActionRow,
  renderBadge,
} from './framework-menu-ui-components-lib';

type ConsumerAction = {
  id: string;
  label: string;
  execute: () => Promise<void>;
};

export const createConsumerMenuRuntime = (params: {
  runRepoGate: () => Promise<void>;
  runRepoAndStagedGate: () => Promise<void>;
  runStagedGate: () => Promise<void>;
  runWorkingTreeGate: () => Promise<void>;
  runPreflight?: (
    stage: 'PRE_COMMIT' | 'PRE_PUSH'
  ) => Promise<string | void> | string | void;
  write: (text: string) => void;
}): {
  actions: ReadonlyArray<ConsumerAction>;
  printMenu: () => void;
} => {
  const useColor = (): boolean => {
    if (process.env.NO_COLOR === '1') {
      return false;
    }
    return process.stdout.isTTY === true;
  };

  const renderSummary = (): LegacyAuditSummary => {
    const summary = readLegacyAuditSummary(process.cwd());
    params.write(`\n${formatLegacyAuditReport(summary, {
      panelWidth: resolveLegacyPanelOuterWidth(),
      color: useColor(),
    })}\n`);
    return summary;
  };

  const printEmptyScopeHint = (summary: LegacyAuditSummary, scope: 'staged' | 'workingTree'): void => {
    if (summary.status !== 'ok' || summary.filesScanned > 0) {
      return;
    }
    if (scope === 'staged') {
      params.write(
        '\nℹ Scope vacío (staged): no hay archivos staged para auditar. Resultado PASS por alcance vacío; usa 1 o 2 para validar repo completo.\n'
      );
      return;
    }
    params.write(
      '\nℹ Scope vacío (working tree): no hay cambios sin commitear para auditar. Resultado PASS por alcance vacío; usa 1 o 2 para validar repo completo.\n'
    );
  };

  const runPreflight = async (stage: 'PRE_COMMIT' | 'PRE_PUSH'): Promise<void> => {
    if (params.runPreflight) {
      const rendered = await params.runPreflight(stage);
      if (typeof rendered === 'string' && rendered.trim().length > 0) {
        params.write(`\n${rendered}\n`);
      }
      return;
    }

    const preflight = runConsumerPreflight({
      stage,
      repoRoot: process.cwd(),
    });
    params.write(
      `\n${formatConsumerPreflight(preflight, {
        panelWidth: resolveLegacyPanelOuterWidth(),
        color: useColor(),
      })}\n`
    );
  };

  const actions = createConsumerLegacyMenuActions({
    runFullAudit: async () => {
      await runPreflight('PRE_COMMIT');
      await params.runRepoGate();
      renderSummary();
    },
    runStrictRepoAndStaged: async () => {
      await runPreflight('PRE_PUSH');
      await params.runRepoAndStagedGate();
      renderSummary();
    },
    runStrictStagedOnly: async () => {
      await runPreflight('PRE_COMMIT');
      await params.runStagedGate();
      const summary = renderSummary();
      printEmptyScopeHint(summary, 'staged');
    },
    runStandardCriticalHigh: async () => {
      await runPreflight('PRE_PUSH');
      await params.runWorkingTreeGate();
      const summary = renderSummary();
      printEmptyScopeHint(summary, 'workingTree');
    },
    runPatternChecks: async () => {
      params.write(`\n${formatLegacyPatternChecks(readLegacyAuditSummary(process.cwd()))}\n`);
    },
    runEslintAudit: async () => {
      params.write(`\n${formatLegacyEslintAudit(readLegacyAuditSummary(process.cwd()))}\n`);
    },
    runAstIntelligence: async () => {
      params.write(`\n${formatLegacyAstBreakdown(readLegacyAuditSummary(process.cwd()))}\n`);
    },
    runExportMarkdown: async () => {
      const filePath = exportLegacyAuditMarkdown();
      params.write(`\nMarkdown exported: ${filePath}\n`);
    },
    runFileDiagnostics: async () => {
      params.write(`\n${formatLegacyFileDiagnostics(readLegacyAuditSummary(process.cwd()))}\n`);
    },
  });

  const printMenu = (): void => {
    const menuSummary = readLegacyAuditSummary(process.cwd());
    const menuStatus = menuSummary.status !== 'ok'
      ? { level: 'info' as const, label: 'NO_EVIDENCE' }
      : menuSummary.bySeverity.CRITICAL > 0 || menuSummary.bySeverity.HIGH > 0
        ? { level: 'block' as const, label: 'BLOCK' }
        : menuSummary.bySeverity.MEDIUM > 0 || menuSummary.bySeverity.LOW > 0
          ? { level: 'warn' as const, label: 'WARN' }
          : { level: 'ok' as const, label: 'PASS' };
    const tokens = buildCliDesignTokens({
      width: resolveLegacyPanelOuterWidth(),
      color: useColor(),
    });
    const groupedActions = resolveConsumerMenuLayout(actions);
    const lines = [
      'PUMUKI — Hook-System (run: npx ast-hooks)',
      'AST Intelligence System Overview',
      `Status: ${renderBadge(menuStatus.label, menuStatus.level, tokens)}`,
      'A. Switch to advanced menu',
      '',
      ...groupedActions.flatMap((group) => [
        group.title,
        ...group.items.map((item) => renderActionRow({
          id: item.id,
          label: item.action.label,
        })),
        '',
      ]),
    ];
    params.write(`\n${renderLegacyPanel(lines, {
      width: resolveLegacyPanelOuterWidth(),
      color: useColor(),
    })}\n`);
  };

  return {
    actions,
    printMenu,
  };
};
