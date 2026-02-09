import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';

export const appendInputsSection = (params: {
  lines: string[];
  phase5StatusReportPath: string;
  phase5BlockersReportPath: string;
  consumerUnblockReportPath: string;
  mockAbReportPath: string;
  runReportPath: string;
  hasPhase5StatusReport: boolean;
  hasPhase5BlockersReport: boolean;
  hasConsumerUnblockReport: boolean;
  hasMockAbReport: boolean;
  hasRunReport: boolean;
  summary: Phase5ExternalHandoffSummary;
}): void => {
  params.lines.push('## Inputs');
  params.lines.push('');
  params.lines.push(
    `- phase5_status_report: \`${params.phase5StatusReportPath}\` (${params.hasPhase5StatusReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- phase5_blockers_report: \`${params.phase5BlockersReportPath}\` (${params.hasPhase5BlockersReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- consumer_unblock_report: \`${params.consumerUnblockReportPath}\` (${params.hasConsumerUnblockReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- mock_ab_report: \`${params.mockAbReportPath}\` (${params.hasMockAbReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- phase5_run_report: \`${params.runReportPath}\` (${params.hasRunReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- require_mock_ab_report: ${params.summary.requireMockAbReport ? 'YES' : 'NO'}`
  );
  params.lines.push(
    `- require_artifact_urls: ${params.summary.requireArtifactUrls ? 'YES' : 'NO'}`
  );
  params.lines.push('');
};

export const appendParsedVerdictsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  params.lines.push('## Parsed Verdicts');
  params.lines.push('');
  params.lines.push(`- phase5_status: ${params.summary.phase5StatusVerdict ?? 'unknown'}`);
  params.lines.push(`- phase5_blockers: ${params.summary.phase5BlockersVerdict ?? 'unknown'}`);
  params.lines.push(`- consumer_unblock: ${params.summary.consumerUnblockVerdict ?? 'unknown'}`);
  params.lines.push(`- mock_ab: ${params.summary.mockAbVerdict ?? 'unknown'}`);
  params.lines.push(`- phase5_run_report: ${params.summary.runReportVerdict ?? 'unknown'}`);
  params.lines.push('');
};
