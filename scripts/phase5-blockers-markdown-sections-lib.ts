import type { Phase5BlockersSummary } from './phase5-blockers-contract';

const appendPhase5BlockersList = (params: {
  lines: string[];
  values: ReadonlyArray<string>;
}): void => {
  if (params.values.length === 0) {
    params.lines.push('- none');
    return;
  }

  for (const value of params.values) {
    params.lines.push(`- ${value}`);
  }
};

export const appendPhase5BlockersHeaderSection = (params: {
  lines: string[];
  generatedAt: string;
  summary: Phase5BlockersSummary;
}): void => {
  params.lines.push('# Phase 5 Blockers Readiness');
  params.lines.push('');
  params.lines.push(`- generated_at: ${params.generatedAt}`);
  params.lines.push(`- verdict: ${params.summary.verdict}`);
  params.lines.push('');
};

export const appendPhase5BlockersInputsSection = (params: {
  lines: string[];
  adapterReportPath: string;
  consumerTriageReportPath: string;
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  requireAdapterReport: boolean;
}): void => {
  params.lines.push('## Inputs');
  params.lines.push('');
  params.lines.push(
    `- adapter_report: \`${params.adapterReportPath}\` (${params.hasAdapterReport ? 'found' : 'missing'})`
  );
  params.lines.push(`- adapter_required: ${params.requireAdapterReport ? 'YES' : 'NO'}`);
  params.lines.push(
    `- consumer_triage_report: \`${params.consumerTriageReportPath}\` (${params.hasConsumerTriageReport ? 'found' : 'missing'})`
  );
  params.lines.push('');
};

export const appendPhase5BlockersSignalsSection = (params: {
  lines: string[];
  summary: Phase5BlockersSummary;
}): void => {
  params.lines.push('## Signals');
  params.lines.push('');
  params.lines.push(
    `- adapter_validation_result: ${params.summary.adapterValidationResult ?? 'unknown'}`
  );
  params.lines.push(
    `- consumer_triage_verdict: ${params.summary.consumerTriageVerdict ?? 'unknown'}`
  );
  params.lines.push('');
};

export const appendPhase5BlockersListSection = (params: {
  lines: string[];
  summary: Phase5BlockersSummary;
}): void => {
  params.lines.push('## Blockers');
  params.lines.push('');
  appendPhase5BlockersList({
    lines: params.lines,
    values: params.summary.blockers,
  });
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
    params.lines.push('- Phase 5 blockers are clear for execution closure.');
    params.lines.push('- Attach this report to release/rollout notes.');
    if (!params.hasAdapterReport) {
      params.lines.push(
        '- Optional: generate Adapter report for adapter diagnostics traceability (`npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`).'
      );
    }
    params.lines.push('');
    return;
  }

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
