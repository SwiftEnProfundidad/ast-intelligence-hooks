import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import type {
  AdapterRealSessionEvaluation,
  AdapterRealSessionSignals,
} from './adapter-real-session-analysis-lib';
import {
  appendCapturedEvidenceSection,
  appendHeaderSection,
  appendObservedRuntimeSignalsSection,
  appendOutcomeSection,
  appendPreconditionsSection,
  appendRealSessionStepsSection,
  appendSourcesSection,
} from './adapter-real-session-markdown-core-sections-lib';
import { appendAttachedSnippetsSection } from './adapter-real-session-markdown-snippet-section-lib';

export const buildAdapterRealSessionReportLines = (params: {
  report: AdapterRealSessionReportParams;
  signals: AdapterRealSessionSignals;
  evaluation: AdapterRealSessionEvaluation;
}): ReadonlyArray<string> => {
  const lines: string[] = [];

  appendHeaderSection(lines, params.report);
  appendPreconditionsSection(lines, params.evaluation);
  appendRealSessionStepsSection(lines, params.signals);
  appendObservedRuntimeSignalsSection(lines, params.signals);
  appendCapturedEvidenceSection(lines, params.report);
  appendOutcomeSection(lines, params.evaluation);
  appendSourcesSection(lines, params.report);
  appendAttachedSnippetsSection(lines, params.report);

  return lines;
};
