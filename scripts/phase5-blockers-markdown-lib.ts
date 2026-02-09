import type { Phase5BlockersSummary } from './phase5-blockers-contract';
import {
  appendPhase5BlockersHeaderSection,
  appendPhase5BlockersInputsSection,
  appendPhase5BlockersListSection,
  appendPhase5BlockersNextActionsSection,
  appendPhase5BlockersSignalsSection,
} from './phase5-blockers-markdown-sections-lib';

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

  appendPhase5BlockersHeaderSection({
    lines,
    generatedAt: params.generatedAt,
    summary: params.summary,
  });
  appendPhase5BlockersInputsSection({
    lines,
    adapterReportPath: params.adapterReportPath,
    consumerTriageReportPath: params.consumerTriageReportPath,
    hasAdapterReport: params.hasAdapterReport,
    hasConsumerTriageReport: params.hasConsumerTriageReport,
    requireAdapterReport: params.requireAdapterReport,
  });
  appendPhase5BlockersSignalsSection({
    lines,
    summary: params.summary,
  });
  appendPhase5BlockersListSection({
    lines,
    summary: params.summary,
  });
  appendPhase5BlockersNextActionsSection({
    lines,
    summary: params.summary,
    hasAdapterReport: params.hasAdapterReport,
    hasConsumerTriageReport: params.hasConsumerTriageReport,
    requireAdapterReport: params.requireAdapterReport,
  });

  return `${lines.join('\n')}\n`;
};
