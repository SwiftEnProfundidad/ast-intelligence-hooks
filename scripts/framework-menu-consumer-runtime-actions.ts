import { createConsumerLegacyMenuActions } from './framework-menu-consumer-actions-lib';
import { formatConsumerPreflight, runConsumerPreflight } from './framework-menu-consumer-preflight-lib';
import {
  buildConsumerRuntimeBlockedSummary,
  exportConsumerRuntimeMarkdown,
  notifyConsumerRuntimeAuditSummary,
  printConsumerRuntimeEmptyScopeHint,
  printPrePushTrackedEvidenceDiskHint,
  renderConsumerRuntimeAstBreakdown,
  renderConsumerRuntimeEslintAudit,
  renderConsumerRuntimeFileDiagnostics,
  renderConsumerRuntimePatternChecks,
  renderConsumerRuntimeSummary,
} from './framework-menu-consumer-runtime-audit';
import type { ConsumerPreflightResult } from './framework-menu-consumer-preflight-types';
import type { ConsumerAction, ConsumerRuntimeEmitNotification, ConsumerRuntimeWrite } from './framework-menu-consumer-runtime-types';

type ConsumerRuntimeActionDependencies = {
  repoRoot: string;
  write: ConsumerRuntimeWrite;
  useColor: () => boolean;
  runRepoGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runRepoAndStagedGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runStagedGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runUnstagedGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runWorkingTreeGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runWorkingTreePreCommitGate: () => Promise<ConsumerRuntimeGateResult | void>;
  runPreflight?: (
    stage: 'PRE_COMMIT' | 'PRE_PUSH'
  ) => Promise<string | void> | string | void;
  emitNotification: ConsumerRuntimeEmitNotification;
  clearSummaryOverride: () => void;
  getSummaryOverride: () => import('./framework-menu-evidence-summary-lib').FrameworkMenuEvidenceSummary | null;
  setSummaryOverride: (
    summary: import('./framework-menu-evidence-summary-lib').FrameworkMenuEvidenceSummary | null
  ) => void;
  clearLastPreflight: () => void;
  setLastPreflight: (result: ConsumerPreflightResult | null) => void;
};

const runConsumerRuntimePreflight = async (
  dependencies: Pick<
    ConsumerRuntimeActionDependencies,
    'repoRoot' | 'runPreflight' | 'useColor' | 'write' | 'setLastPreflight'
  >,
  stage: 'PRE_COMMIT' | 'PRE_PUSH'
): Promise<void> => {
  if (dependencies.runPreflight) {
    const rendered = await dependencies.runPreflight(stage);
    dependencies.setLastPreflight(null);
    if (typeof rendered === 'string' && rendered.trim().length > 0) {
      dependencies.write(`\n${rendered}\n`);
    }
    return;
  }

  const preflight = runConsumerPreflight({
    stage,
    repoRoot: dependencies.repoRoot,
  });
  dependencies.setLastPreflight(preflight);
  dependencies.write(
    `\n${formatConsumerPreflight(preflight, {
      color: dependencies.useColor(),
    })}\n`
  );
};

export const createConsumerRuntimeActions = (
  dependencies: ConsumerRuntimeActionDependencies
): ReadonlyArray<ConsumerAction> =>
  createConsumerLegacyMenuActions({
    runFullAudit: async () => {
      await runConsumerRuntimePreflight(dependencies, 'PRE_COMMIT');
      await dependencies.runRepoGate();
      dependencies.clearSummaryOverride();
      notifyConsumerRuntimeAuditSummary(
        {
          emitNotification: dependencies.emitNotification,
          repoRoot: dependencies.repoRoot,
        },
        renderConsumerRuntimeSummary({
          repoRoot: dependencies.repoRoot,
          write: dependencies.write,
          useColor: dependencies.useColor,
        })
      );
    },
    runStrictRepoAndStaged: async () => {
      await runConsumerRuntimePreflight(dependencies, 'PRE_PUSH');
      const gateResult = await dependencies.runRepoAndStagedGate();
      if (gateResult?.blocked) {
        dependencies.setSummaryOverride(
          buildConsumerRuntimeBlockedSummary(gateResult.blocked)
        );
      } else {
        dependencies.clearSummaryOverride();
      }
      const summary = renderConsumerRuntimeSummary({
        repoRoot: dependencies.repoRoot,
        write: dependencies.write,
        useColor: dependencies.useColor,
        summaryOverride: dependencies.getSummaryOverride(),
      });
      notifyConsumerRuntimeAuditSummary(
        {
          emitNotification: dependencies.emitNotification,
          repoRoot: dependencies.repoRoot,
        },
        summary
      );
      if (
        !gateResult?.blocked
        && (summary.outcome === 'PASS' || summary.outcome === 'WARN')
      ) {
        printPrePushTrackedEvidenceDiskHint({ write: dependencies.write });
      }
    },
    runStrictStagedOnly: async () => {
      await runConsumerRuntimePreflight(dependencies, 'PRE_COMMIT');
      await dependencies.runStagedGate();
      dependencies.clearSummaryOverride();
      const summary = renderConsumerRuntimeSummary({
        repoRoot: dependencies.repoRoot,
        write: dependencies.write,
        useColor: dependencies.useColor,
      });
      notifyConsumerRuntimeAuditSummary(
        {
          emitNotification: dependencies.emitNotification,
          repoRoot: dependencies.repoRoot,
        },
        summary
      );
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'staged');
    },
    runStandardCriticalHigh: async () => {
      await runConsumerRuntimePreflight(dependencies, 'PRE_PUSH');
      await dependencies.runWorkingTreeGate();
      dependencies.clearSummaryOverride();
      const summary = renderConsumerRuntimeSummary({
        repoRoot: dependencies.repoRoot,
        write: dependencies.write,
        useColor: dependencies.useColor,
      });
      notifyConsumerRuntimeAuditSummary(
        {
          emitNotification: dependencies.emitNotification,
          repoRoot: dependencies.repoRoot,
        },
        summary
      );
      if (summary.outcome === 'PASS' || summary.outcome === 'WARN') {
        printPrePushTrackedEvidenceDiskHint({ write: dependencies.write });
      }
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'workingTree');
    },
    runEngineStagedNoPreflight: async () => {
      await dependencies.runStagedGate();
      dependencies.clearSummaryOverride();
      const summary = renderConsumerRuntimeSummary({
        repoRoot: dependencies.repoRoot,
        write: dependencies.write,
        useColor: dependencies.useColor,
      });
      notifyConsumerRuntimeAuditSummary(
        {
          emitNotification: dependencies.emitNotification,
          repoRoot: dependencies.repoRoot,
        },
        summary
      );
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'staged');
    },
    runEngineUnstagedNoPreflight: async () => {
      await dependencies.runUnstagedGate();
      dependencies.clearSummaryOverride();
      const summary = renderConsumerRuntimeSummary({
        repoRoot: dependencies.repoRoot,
        write: dependencies.write,
        useColor: dependencies.useColor,
      });
      notifyConsumerRuntimeAuditSummary(
        {
          emitNotification: dependencies.emitNotification,
          repoRoot: dependencies.repoRoot,
        },
        summary
      );
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'unstaged');
    },
    runEngineStagedAndUnstagedNoPreflight: async () => {
      await dependencies.runWorkingTreePreCommitGate();
      dependencies.clearSummaryOverride();
      const summary = renderConsumerRuntimeSummary({
        repoRoot: dependencies.repoRoot,
        write: dependencies.write,
        useColor: dependencies.useColor,
      });
      notifyConsumerRuntimeAuditSummary(
        {
          emitNotification: dependencies.emitNotification,
          repoRoot: dependencies.repoRoot,
        },
        summary
      );
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'workingTree');
    },
    runEngineFullRepoNoPreflight: async () => {
      await dependencies.runRepoGate();
      dependencies.clearSummaryOverride();
      const summary = renderConsumerRuntimeSummary({
        repoRoot: dependencies.repoRoot,
        write: dependencies.write,
        useColor: dependencies.useColor,
      });
      notifyConsumerRuntimeAuditSummary(
        {
          emitNotification: dependencies.emitNotification,
          repoRoot: dependencies.repoRoot,
        },
        summary
      );
    },
    runPatternChecks: async () => {
      dependencies.clearLastPreflight();
      dependencies.write(`\n${renderConsumerRuntimePatternChecks(dependencies.repoRoot)}\n`);
    },
    runEslintAudit: async () => {
      dependencies.clearLastPreflight();
      dependencies.write(`\n${renderConsumerRuntimeEslintAudit(dependencies.repoRoot)}\n`);
    },
    runAstIntelligence: async () => {
      dependencies.clearLastPreflight();
      dependencies.write(`\n${renderConsumerRuntimeAstBreakdown(dependencies.repoRoot)}\n`);
    },
    runExportMarkdown: async () => {
      dependencies.clearLastPreflight();
      const filePath = exportConsumerRuntimeMarkdown(
        dependencies.repoRoot,
        dependencies.getSummaryOverride()
      );
      dependencies.write(`\nLegacy read-only markdown exported: ${filePath}\n`);
    },
    runFileDiagnostics: async () => {
      dependencies.clearLastPreflight();
      dependencies.write(`\n${renderConsumerRuntimeFileDiagnostics(dependencies.repoRoot)}\n`);
    },
  }) as ReadonlyArray<ConsumerAction>;
