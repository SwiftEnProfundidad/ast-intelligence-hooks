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

export const appendPhase5ExternalHandoffSections = (params: {
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
  appendInputsSection({
    lines: params.lines,
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
    lines: params.lines,
    summary: params.summary,
  });
  appendArtifactUrlsSection({
    lines: params.lines,
    summary: params.summary,
  });
  appendMissingInputsSection({
    lines: params.lines,
    summary: params.summary,
  });
  appendBlockersSection({
    lines: params.lines,
    summary: params.summary,
  });
  appendWarningsSection({
    lines: params.lines,
    summary: params.summary,
  });
  appendNextActionsSection({
    lines: params.lines,
    summary: params.summary,
  });
};
