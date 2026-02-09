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
