import type {
  BuildPhase5ExecutionClosureStatusMarkdownParams,
  Phase5ExecutionClosureSummary,
} from './phase5-execution-closure-status-contract';
import { appendPhase5ExecutionClosureStatusList } from './phase5-execution-closure-status-markdown-list-lib';

export const appendPhase5ExecutionClosureStatusHeader = (
  lines: string[],
  params: BuildPhase5ExecutionClosureStatusMarkdownParams
): void => {
  lines.push('# Phase 5 Execution Closure Status');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');
};

export const appendPhase5ExecutionClosureStatusInputs = (
  lines: string[],
  params: BuildPhase5ExecutionClosureStatusMarkdownParams
): void => {
  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- phase5_blockers_report: \`${params.phase5BlockersReportPath}\` (${params.hasPhase5BlockersReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- consumer_unblock_report: \`${params.consumerUnblockReportPath}\` (${params.hasConsumerUnblockReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- adapter_readiness_report: \`${params.adapterReadinessReportPath}\` (${params.hasAdapterReadinessReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- adapter_readiness_required: ${params.summary.requireAdapterReadiness ? 'YES' : 'NO'}`
  );
  lines.push('');
};

export const appendPhase5ExecutionClosureStatusVerdicts = (
  lines: string[],
  summary: Phase5ExecutionClosureSummary
): void => {
  lines.push('## Parsed Verdicts');
  lines.push('');
  lines.push(`- phase5_blockers: ${summary.phase5BlockersVerdict ?? 'unknown'}`);
  lines.push(`- consumer_unblock: ${summary.consumerUnblockVerdict ?? 'unknown'}`);
  lines.push(`- adapter_readiness: ${summary.adapterReadinessVerdict ?? 'unknown'}`);
  lines.push('');
};

export const appendPhase5ExecutionClosureStatusFindings = (
  lines: string[],
  summary: Phase5ExecutionClosureSummary
): void => {
  appendPhase5ExecutionClosureStatusList(lines, '## Missing Inputs', summary.missingInputs);
  appendPhase5ExecutionClosureStatusList(lines, '## Blockers', summary.blockers);
  appendPhase5ExecutionClosureStatusList(lines, '## Warnings', summary.warnings);
};
