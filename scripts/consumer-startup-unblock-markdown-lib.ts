import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-parser-lib';
import type {
  ConsumerStartupUnblockSummary,
  ParsedWorkflowLintReport,
} from './consumer-startup-unblock-contract';
import { buildConsumerStartupUnblockNextActionLines } from './consumer-startup-unblock-markdown-next-actions-lib';
import {
  buildConsumerStartupUnblockBlockerLines,
  buildConsumerStartupUnblockHeaderLines,
  buildConsumerStartupUnblockInputLines,
  buildConsumerStartupUnblockSignalLines,
} from './consumer-startup-unblock-markdown-sections-lib';

export const buildConsumerStartupUnblockStatus = (params: {
  repo: string;
  supportBundlePath: string;
  authReportPath: string;
  workflowLintReportPath: string;
  hasSupportBundle: boolean;
  hasAuthReport: boolean;
  hasWorkflowLintReport: boolean;
  summary: ConsumerStartupUnblockSummary;
  support?: ParsedSupportBundle;
  auth?: ParsedAuthReport;
  workflowLint?: ParsedWorkflowLintReport;
}): string => {
  const lines = [
    ...buildConsumerStartupUnblockHeaderLines({
      generatedAt: new Date().toISOString(),
      repo: params.repo,
      verdict: params.summary.verdict,
    }),
    ...buildConsumerStartupUnblockInputLines({
      supportBundlePath: params.supportBundlePath,
      authReportPath: params.authReportPath,
      workflowLintReportPath: params.workflowLintReportPath,
      hasSupportBundle: params.hasSupportBundle,
      hasAuthReport: params.hasAuthReport,
      hasWorkflowLintReport: params.hasWorkflowLintReport,
    }),
    ...buildConsumerStartupUnblockSignalLines(params.summary),
    ...buildConsumerStartupUnblockBlockerLines(params.summary),
    ...buildConsumerStartupUnblockNextActionLines(params.summary),
  ];

  return `${lines.join('\n')}\n`;
};
