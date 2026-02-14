import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';
import { appendPhase5ExternalHandoffHeaderLines } from './phase5-external-handoff-markdown-header-lib';
import { appendPhase5ExternalHandoffSections } from './phase5-external-handoff-markdown-sections-append-lib';

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

  appendPhase5ExternalHandoffHeaderLines({
    lines,
    generatedAt: params.generatedAt,
    repo: params.repo,
    summary: params.summary,
  });
  appendPhase5ExternalHandoffSections({
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

  return `${lines.join('\n')}\n`;
};
