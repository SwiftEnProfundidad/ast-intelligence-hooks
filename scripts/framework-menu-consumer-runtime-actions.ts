import { createConsumerLegacyMenuActions } from './framework-menu-consumer-actions-lib';
import { formatConsumerPreflight, runConsumerPreflight } from './framework-menu-consumer-preflight-lib';
import {
  buildConsumerRuntimeBlockedSummary,
  buildConsumerRuntimeBlockedCauseLines,
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
import type {
  ConsumerAction,
  ConsumerRuntimeEmitNotification,
  ConsumerRuntimeGateResult,
  ConsumerRuntimeWrite,
} from './framework-menu-consumer-runtime-types';

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

const renderSummaryAfterGate = (
  dependencies: Pick<
    ConsumerRuntimeActionDependencies,
    | 'clearSummaryOverride'
    | 'emitNotification'
    | 'getSummaryOverride'
    | 'repoRoot'
    | 'setSummaryOverride'
    | 'useColor'
    | 'write'
  >,
  gateResult: ConsumerRuntimeGateResult | void
) => {
  if (gateResult?.blocked) {
    dependencies.setSummaryOverride(
      buildConsumerRuntimeBlockedSummary(gateResult.blocked)
    );
    dependencies.write(
      '\n' +
        buildConsumerRuntimeBlockedCauseLines(gateResult.blocked).join('\n') +
        '\n'
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
  return summary;
};

const buildFullAuditFinalSummaryLines = (
  summary: import('./framework-menu-evidence-summary-lib').FrameworkMenuEvidenceSummary
): string[] => {
  const platformRows = summary.platformAuditRows ?? [];
  const topFindings = summary.topFindings.slice(0, 10);
  return [
    '✅ AST Intelligence completed',
    '═══════════════════════════════════════════════════════════════',
    'FINAL SUMMARY - VIOLATIONS BY SEVERITY',
    `🔴 CRITICAL: ${summary.byEnterpriseSeverity?.CRITICAL ?? summary.bySeverity.CRITICAL}`,
    `🟠 HIGH:     ${summary.byEnterpriseSeverity?.HIGH ?? summary.bySeverity.ERROR}`,
    `🟡 MEDIUM:   ${summary.byEnterpriseSeverity?.MEDIUM ?? summary.bySeverity.WARN}`,
    `🔵 LOW:      ${summary.byEnterpriseSeverity?.LOW ?? summary.bySeverity.INFO}`,
    `Total violations: ${summary.totalFindings}`,
    '',
    'PLATFORM-SPECIFIC ANALYSIS',
    ...(platformRows.length === 0
      ? ['  No platform findings.']
      : platformRows.map((row) => `  Platform: ${row.platform} -> ${row.violations} violations`)),
    '',
    'TOP VIOLATIONS & REMEDIATION',
    ...(topFindings.length === 0
      ? ['  No violations detected.']
      : topFindings.map(
          (finding) =>
            `  [${finding.severity}] ${finding.ruleId} -> ${finding.file}:${finding.line}`
        )),
  ];
};

export const createConsumerRuntimeActions = (
  dependencies: ConsumerRuntimeActionDependencies
): ReadonlyArray<ConsumerAction> =>
  createConsumerLegacyMenuActions({
    runFullAudit: async () => {
      dependencies.write(
        '\n' +
          [
            'Collecting source files...',
            'Running pattern checks...',
            'Running ESLint audits...',
            '⚙️ AST Intelligence',
            'Running AST analysis...',
          ].join('\n') +
          '\n'
      );
      await runConsumerRuntimePreflight(dependencies, 'PRE_COMMIT');
      const summary = renderSummaryAfterGate(dependencies, await dependencies.runRepoGate());
      dependencies.write(
        `\n${buildFullAuditFinalSummaryLines(summary).join('\n')}\n`
      );
    },
    runStrictRepoAndStaged: async () => {
      await runConsumerRuntimePreflight(dependencies, 'PRE_PUSH');
      const gateResult = await dependencies.runRepoAndStagedGate();
      const summary = renderSummaryAfterGate(dependencies, gateResult);
      if (
        !gateResult?.blocked
        && (summary.outcome === 'PASS' || summary.outcome === 'WARN')
      ) {
        printPrePushTrackedEvidenceDiskHint({ write: dependencies.write });
      }
    },
    runStrictStagedOnly: async () => {
      await runConsumerRuntimePreflight(dependencies, 'PRE_COMMIT');
      const summary = renderSummaryAfterGate(dependencies, await dependencies.runStagedGate());
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'staged');
    },
    runStandardCriticalHigh: async () => {
      await runConsumerRuntimePreflight(dependencies, 'PRE_PUSH');
      const gateResult = await dependencies.runWorkingTreeGate();
      const summary = renderSummaryAfterGate(dependencies, gateResult);
      if (summary.outcome === 'PASS' || summary.outcome === 'WARN') {
        printPrePushTrackedEvidenceDiskHint({ write: dependencies.write });
      }
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'workingTree');
    },
    runEngineStagedNoPreflight: async () => {
      const summary = renderSummaryAfterGate(dependencies, await dependencies.runStagedGate());
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'staged');
    },
    runEngineUnstagedNoPreflight: async () => {
      const summary = renderSummaryAfterGate(dependencies, await dependencies.runUnstagedGate());
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'unstaged');
    },
    runEngineStagedAndUnstagedNoPreflight: async () => {
      const summary = renderSummaryAfterGate(
        dependencies,
        await dependencies.runWorkingTreePreCommitGate()
      );
      printConsumerRuntimeEmptyScopeHint({ write: dependencies.write }, summary, 'workingTree');
    },
    runEngineFullRepoNoPreflight: async () => {
      renderSummaryAfterGate(dependencies, await dependencies.runRepoGate());
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
      const filePath = exportConsumerRuntimeMarkdown(
        dependencies.repoRoot,
        dependencies.getSummaryOverride()
      );
      dependencies.write(`\nLegacy read-only markdown exported: ${filePath}\n`);
    },
    runFileDiagnostics: async () => {
      dependencies.write(`\n${renderConsumerRuntimeFileDiagnostics(dependencies.repoRoot)}\n`);
    },
  }) as ReadonlyArray<ConsumerAction>;
