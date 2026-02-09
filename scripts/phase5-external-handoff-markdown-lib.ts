import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';
import {
  appendArtifactUrlsSection,
  appendBlockersSection,
  appendInputsSection,
  appendMissingInputsSection,
  appendNextActionsSection,
  appendParsedVerdictsSection,
  appendWarningsSection,
} from './phase5-external-handoff-markdown-sections-lib';

export const buildPhase5ExternalHandoffMarkdown = (params: {
  generatedAt: string;
  repo: string;
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
}): string => {
  const lines: string[] = [];

  lines.push('# Phase 5 External Handoff Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  appendInputsSection({
    lines,
    phase5StatusReportPath: params.phase5StatusReportPath,
    phase5BlockersReportPath: params.phase5BlockersReportPath,
    consumerUnblockReportPath: params.consumerUnblockReportPath,
    mockAbReportPath: params.mockAbReportPath,
    runReportPath: params.runReportPath,
    hasPhase5StatusReport: params.hasPhase5StatusReport,
    hasPhase5BlockersReport: params.hasPhase5BlockersReport,
    hasConsumerUnblockReport: params.hasConsumerUnblockReport,
    hasMockAbReport: params.hasMockAbReport,
    hasRunReport: params.hasRunReport,
    summary: params.summary,
  });
  appendParsedVerdictsSection({
    lines,
    summary: params.summary,
  });
  appendArtifactUrlsSection({
    lines,
    summary: params.summary,
  });
  appendMissingInputsSection({
    lines,
    summary: params.summary,
  });
  appendBlockersSection({
    lines,
    summary: params.summary,
  });
  appendWarningsSection({
    lines,
    summary: params.summary,
  });
  appendNextActionsSection({
    lines,
    summary: params.summary,
  });

  return `${lines.join('\n')}\n`;
};
