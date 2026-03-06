import { createConsumerLegacyMenuActions } from './framework-menu-consumer-actions-lib';
import { formatConsumerPreflight, runConsumerPreflight } from './framework-menu-consumer-preflight-lib';
import {
  exportConsumerRuntimeMarkdown,
  notifyConsumerRuntimeAuditSummary,
  printConsumerRuntimeEmptyScopeHint,
  renderConsumerRuntimeAstBreakdown,
  renderConsumerRuntimeEslintAudit,
  renderConsumerRuntimeFileDiagnostics,
  renderConsumerRuntimePatternChecks,
  renderConsumerRuntimeSummary,
} from './framework-menu-consumer-runtime-audit';
import type { ConsumerAction, ConsumerRuntimeEmitNotification, ConsumerRuntimeWrite } from './framework-menu-consumer-runtime-types';

type ConsumerRuntimeActionDependencies = {
  repoRoot: string;
  write: ConsumerRuntimeWrite;
  useColor: () => boolean;
  runRepoGate: () => Promise<void>;
  runRepoAndStagedGate: () => Promise<void>;
  runStagedGate: () => Promise<void>;
  runWorkingTreeGate: () => Promise<void>;
  runPreflight?: (
    stage: 'PRE_COMMIT' | 'PRE_PUSH'
  ) => Promise<string | void> | string | void;
  emitNotification: ConsumerRuntimeEmitNotification;
};

const runConsumerRuntimePreflight = async (
  dependencies: Pick<
    ConsumerRuntimeActionDependencies,
    'repoRoot' | 'runPreflight' | 'useColor' | 'write'
  >,
  stage: 'PRE_COMMIT' | 'PRE_PUSH'
): Promise<void> => {
  if (dependencies.runPreflight) {
    const rendered = await dependencies.runPreflight(stage);
    if (typeof rendered === 'string' && rendered.trim().length > 0) {
      dependencies.write(`\n${rendered}\n`);
    }
    return;
  }

  const preflight = runConsumerPreflight({
    stage,
    repoRoot: dependencies.repoRoot,
  });
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
      await dependencies.runRepoAndStagedGate();
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
    runStrictStagedOnly: async () => {
      await runConsumerRuntimePreflight(dependencies, 'PRE_COMMIT');
      await dependencies.runStagedGate();
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
    runPatternChecks: async () => {
      dependencies.write(`\n${renderConsumerRuntimePatternChecks(dependencies.repoRoot)}\n`);
    },
    runEslintAudit: async () => {
      dependencies.write(`\n${renderConsumerRuntimeEslintAudit(dependencies.repoRoot)}\n`);
    },
    runAstIntelligence: async () => {
      dependencies.write(`\n${renderConsumerRuntimeAstBreakdown(dependencies.repoRoot)}\n`);
    },
    runExportMarkdown: async () => {
      const filePath = exportConsumerRuntimeMarkdown(dependencies.repoRoot);
      dependencies.write(`\nMarkdown exported: ${filePath}\n`);
    },
    runFileDiagnostics: async () => {
      dependencies.write(`\n${renderConsumerRuntimeFileDiagnostics(dependencies.repoRoot)}\n`);
    },
  }) as ReadonlyArray<ConsumerAction>;
