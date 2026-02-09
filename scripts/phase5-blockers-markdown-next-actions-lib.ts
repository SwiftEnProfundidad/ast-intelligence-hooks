import type { Phase5BlockersSummary } from './phase5-blockers-contract';

const appendReadyNextActions = (params: {
  lines: string[];
  hasAdapterReport: boolean;
}): void => {
  params.lines.push('- Phase 5 blockers are clear for execution closure.');
  params.lines.push('- Attach this report to release/rollout notes.');
  if (!params.hasAdapterReport) {
    params.lines.push(
      '- Optional: generate Adapter report for adapter diagnostics traceability (`npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`).'
    );
  }
  params.lines.push('');
};

const appendBlockedNextActions = (params: {
  lines: string[];
  summary: Phase5BlockersSummary;
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  requireAdapterReport: boolean;
}): void => {
  if (!params.hasAdapterReport && params.requireAdapterReport) {
    params.lines.push(
      '- Generate Adapter report: `npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`'
    );
  }
  if (!params.hasConsumerTriageReport) {
    params.lines.push(
      '- Generate consumer triage report: `npm run validation:consumer-startup-triage -- --repo <owner>/<repo> --out-dir .audit-reports/consumer-triage --skip-workflow-lint`'
    );
  }
  if (params.summary.blockers.some((item) => item.includes('Adapter runtime'))) {
    params.lines.push(
      '- Execute `docs/validation/adapter-hook-runtime-validation.md` in a real Adapter session and regenerate reports.'
    );
  }
  if (
    params.summary.blockers.some(
      (item) =>
        item.includes('Consumer startup triage') ||
        item.includes('Consumer triage required step failed')
    )
  ) {
    params.lines.push(
      '- Resolve failed consumer triage steps and rerun `validation:consumer-startup-triage` to refresh status.'
    );
  }
  if (!params.hasAdapterReport && !params.requireAdapterReport) {
    params.lines.push(
      '- Optional: attach Adapter adapter diagnostics when validating IDE-specific integrations.'
    );
  }
  params.lines.push('');
};

export const appendPhase5BlockersNextActionsSection = (params: {
  lines: string[];
  summary: Phase5BlockersSummary;
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  requireAdapterReport: boolean;
}): void => {
  params.lines.push('## Next Actions');
  params.lines.push('');
  if (params.summary.verdict === 'READY') {
    appendReadyNextActions({
      lines: params.lines,
      hasAdapterReport: params.hasAdapterReport,
    });
    return;
  }

  appendBlockedNextActions({
    lines: params.lines,
    summary: params.summary,
    hasAdapterReport: params.hasAdapterReport,
    hasConsumerTriageReport: params.hasConsumerTriageReport,
    requireAdapterReport: params.requireAdapterReport,
  });
};
