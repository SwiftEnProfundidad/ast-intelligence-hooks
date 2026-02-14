import {
  buildPhase5ExecutionClosureStatusMarkdown,
  parseVerdictFromMarkdown,
  summarizePhase5ExecutionClosure,
} from './phase5-execution-closure-status-lib';
import type { Phase5ExecutionClosureStatusCliOptions } from './phase5-execution-closure-status-cli-lib';
import { readPhase5ExecutionClosureStatusInput } from './phase5-execution-closure-status-cli-lib';
import type { Phase5ExecutionClosureSummary } from './phase5-execution-closure-status-contract';

export type Phase5ExecutionClosureStatusBuildResult = {
  summary: Phase5ExecutionClosureSummary;
  markdown: string;
};

const readVerdictFromInput = (content?: string): string | undefined =>
  content ? parseVerdictFromMarkdown(content) : undefined;

export const buildPhase5ExecutionClosureStatusResult = (params: {
  cwd: string;
  options: Phase5ExecutionClosureStatusCliOptions;
  generatedAt: string;
}): Phase5ExecutionClosureStatusBuildResult => {
  const phase5BlockersReport = readPhase5ExecutionClosureStatusInput(
    params.cwd,
    params.options.phase5BlockersReportFile
  );
  const consumerUnblockReport = readPhase5ExecutionClosureStatusInput(
    params.cwd,
    params.options.consumerUnblockReportFile
  );
  const adapterReadinessReport = readPhase5ExecutionClosureStatusInput(
    params.cwd,
    params.options.adapterReadinessReportFile
  );

  const summary = summarizePhase5ExecutionClosure({
    hasPhase5BlockersReport: phase5BlockersReport.exists,
    hasConsumerUnblockReport: consumerUnblockReport.exists,
    hasAdapterReadinessReport: adapterReadinessReport.exists,
    phase5BlockersVerdict: readVerdictFromInput(phase5BlockersReport.content),
    consumerUnblockVerdict: readVerdictFromInput(consumerUnblockReport.content),
    adapterReadinessVerdict: readVerdictFromInput(adapterReadinessReport.content),
    requireAdapterReadiness: params.options.requireAdapterReadiness,
  });

  const markdown = buildPhase5ExecutionClosureStatusMarkdown({
    generatedAt: params.generatedAt,
    phase5BlockersReportPath: params.options.phase5BlockersReportFile,
    consumerUnblockReportPath: params.options.consumerUnblockReportFile,
    adapterReadinessReportPath: params.options.adapterReadinessReportFile,
    hasPhase5BlockersReport: phase5BlockersReport.exists,
    hasConsumerUnblockReport: consumerUnblockReport.exists,
    hasAdapterReadinessReport: adapterReadinessReport.exists,
    summary,
  });

  return {
    summary,
    markdown,
  };
};
