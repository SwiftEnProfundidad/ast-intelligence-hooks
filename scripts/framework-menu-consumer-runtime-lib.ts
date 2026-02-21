import { createConsumerLegacyMenuActions } from './framework-menu-consumer-actions-lib';
import {
  exportLegacyAuditMarkdown,
  formatLegacyAstBreakdown,
  formatLegacyAuditReport,
  formatLegacyFileDiagnostics,
  formatLegacyEslintAudit,
  formatLegacyPatternChecks,
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

  const renderSummary = (): void => {
    params.write(`\n${formatLegacyAuditReport(readLegacyAuditSummary(process.cwd()), {
      panelWidth: resolveLegacyPanelOuterWidth(),
      color: useColor(),
    })}\n`);
  };

  const actions = createConsumerLegacyMenuActions({
    runFullAudit: async () => {
      await params.runRepoGate();
      renderSummary();
    },
    runStrictRepoAndStaged: async () => {
      await params.runRepoAndStagedGate();
      renderSummary();
    },
    runStrictStagedOnly: async () => {
      await params.runStagedGate();
      renderSummary();
    },
    runStandardCriticalHigh: async () => {
      await params.runWorkingTreeGate();
      renderSummary();
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
