import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';

export const appendPhase5ExternalHandoffHeaderLines = (params: {
  lines: string[];
  generatedAt: string;
  repo: string;
  summary: Phase5ExternalHandoffSummary;
}): void => {
  params.lines.push('# Phase 5 External Handoff Report');
  params.lines.push('');
  params.lines.push(`- generated_at: ${params.generatedAt}`);
  params.lines.push(`- target_repo: \`${params.repo}\``);
  params.lines.push(`- verdict: ${params.summary.verdict}`);
  params.lines.push('');
};
