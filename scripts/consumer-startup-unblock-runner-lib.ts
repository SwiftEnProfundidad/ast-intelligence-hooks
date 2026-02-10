import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  parseAuthReport,
  parseSupportBundle,
} from './consumer-support-ticket-lib';
import type { ConsumerStartupUnblockCliOptions } from './consumer-startup-unblock-args-contract';
import { readConsumerStartupUnblockInput } from './consumer-startup-unblock-input-lib';
import {
  buildConsumerStartupUnblockStatus,
  parseWorkflowLintReport,
  summarizeConsumerStartupUnblock,
} from './consumer-startup-unblock-status-lib';

export const buildConsumerStartupUnblockReportFromOptions = (params: {
  cwd: string;
  options: ConsumerStartupUnblockCliOptions;
}): { markdown: string; verdict: string } => {
  const supportBundle = readConsumerStartupUnblockInput(params.cwd, params.options.supportBundleFile);
  const authReport = readConsumerStartupUnblockInput(params.cwd, params.options.authReportFile);
  const workflowLintReport = readConsumerStartupUnblockInput(
    params.cwd,
    params.options.workflowLintReportFile
  );

  const parsedSupport = supportBundle.content
    ? parseSupportBundle(supportBundle.content)
    : undefined;
  const parsedAuth = authReport.content ? parseAuthReport(authReport.content) : undefined;
  const parsedWorkflowLint = workflowLintReport.content
    ? parseWorkflowLintReport(workflowLintReport.content)
    : undefined;

  const summary = summarizeConsumerStartupUnblock({
    hasSupportBundle: supportBundle.exists,
    hasAuthReport: authReport.exists,
    support: parsedSupport,
    auth: parsedAuth,
    workflowLint: parsedWorkflowLint,
  });

  return {
    markdown: buildConsumerStartupUnblockStatus({
      repo: params.options.repo,
      supportBundlePath: params.options.supportBundleFile,
      authReportPath: params.options.authReportFile,
      workflowLintReportPath: params.options.workflowLintReportFile,
      hasSupportBundle: supportBundle.exists,
      hasAuthReport: authReport.exists,
      hasWorkflowLintReport: workflowLintReport.exists,
      summary,
      support: parsedSupport,
      auth: parsedAuth,
      workflowLint: parsedWorkflowLint,
    }),
    verdict: summary.verdict,
  };
};

export const writeConsumerStartupUnblockReport = (params: {
  cwd: string;
  outFile: string;
  markdown: string;
}): string => {
  const outputPath = resolve(params.cwd, params.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, params.markdown, 'utf8');
  return outputPath;
};
