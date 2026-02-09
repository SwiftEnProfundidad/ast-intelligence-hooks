import type { Phase5BlockersSummary } from './phase5-blockers-contract';

export const buildPhase5BlockersReadinessMarkdown = (params: {
  generatedAt: string;
  adapterReportPath: string;
  consumerTriageReportPath: string;
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  requireAdapterReport: boolean;
  summary: Phase5BlockersSummary;
}): string => {
  const lines: string[] = [];

  lines.push('# Phase 5 Blockers Readiness');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- adapter_report: \`${params.adapterReportPath}\` (${params.hasAdapterReport ? 'found' : 'missing'})`
  );
  lines.push(`- adapter_required: ${params.requireAdapterReport ? 'YES' : 'NO'}`);
  lines.push(
    `- consumer_triage_report: \`${params.consumerTriageReportPath}\` (${params.hasConsumerTriageReport ? 'found' : 'missing'})`
  );
  lines.push('');

  lines.push('## Signals');
  lines.push('');
  lines.push(
    `- adapter_validation_result: ${params.summary.adapterValidationResult ?? 'unknown'}`
  );
  lines.push(
    `- consumer_triage_verdict: ${params.summary.consumerTriageVerdict ?? 'unknown'}`
  );
  lines.push('');

  lines.push('## Blockers');
  lines.push('');
  if (params.summary.blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of params.summary.blockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (params.summary.verdict === 'READY') {
    lines.push('- Phase 5 blockers are clear for execution closure.');
    lines.push('- Attach this report to release/rollout notes.');
    if (!params.hasAdapterReport) {
      lines.push(
        '- Optional: generate Adapter report for adapter diagnostics traceability (`npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`).'
      );
    }
  } else {
    if (!params.hasAdapterReport && params.requireAdapterReport) {
      lines.push(
        '- Generate Adapter report: `npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`'
      );
    }
    if (!params.hasConsumerTriageReport) {
      lines.push(
        '- Generate consumer triage report: `npm run validation:consumer-startup-triage -- --repo <owner>/<repo> --out-dir .audit-reports/consumer-triage --skip-workflow-lint`'
      );
    }
    if (params.summary.blockers.some((item) => item.includes('Adapter runtime'))) {
      lines.push(
        '- Execute `docs/validation/adapter-hook-runtime-validation.md` in a real Adapter session and regenerate reports.'
      );
    }
    if (
      params.summary.blockers.some(
        (item) => item.includes('Consumer startup triage') || item.includes('Consumer triage required step failed')
      )
    ) {
      lines.push(
        '- Resolve failed consumer triage steps and rerun `validation:consumer-startup-triage` to refresh status.'
      );
    }
    if (!params.hasAdapterReport && !params.requireAdapterReport) {
      lines.push(
        '- Optional: attach Adapter adapter diagnostics when validating IDE-specific integrations.'
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
