import type { Phase5BlockersSummary } from './phase5-blockers-contract';

const hasAdapterRuntimeBlocker = (summary: Phase5BlockersSummary): boolean =>
  summary.blockers.some((item) => item.includes('Adapter runtime'));

const hasConsumerTriageBlocker = (summary: Phase5BlockersSummary): boolean =>
  summary.blockers.some(
    (item) =>
      item.includes('Consumer startup triage') ||
      item.includes('Consumer triage required step failed')
  );

export const appendPhase5BlockersBlockedNextActions = (params: {
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
  if (hasAdapterRuntimeBlocker(params.summary)) {
    params.lines.push(
      '- Execute `docs/validation/adapter-hook-runtime-validation.md` in a real Adapter session and regenerate reports.'
    );
  }
  if (hasConsumerTriageBlocker(params.summary)) {
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
