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
      params.write('\nℹ Scope vacío (staged): no hay archivos staged para auditar. Usa 1 o 2 para auditoría completa.\n');
      return;
    }
    params.write('\nℹ Scope vacío (working tree): no hay cambios sin commitear para auditar. Usa 1 o 2 para auditoría completa.\n');
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
    const lines = [
      'PUMUKI — Hook-System (run: npx ast-hooks)',
      'AST Intelligence System Overview',
      'A. Switch to advanced menu',
      '',
      ...actions.map((action) => `${action.id}) ${action.label}`),
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
