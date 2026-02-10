import type { ConsumerStartupUnblockSummary } from './consumer-startup-unblock-contract';

export const buildConsumerStartupUnblockHeaderLines = (params: {
  generatedAt: string;
  repo: string;
  verdict: ConsumerStartupUnblockSummary['verdict'];
}): ReadonlyArray<string> => [
  '# Consumer Startup Failure Unblock Status',
  '',
  `- generated_at: ${params.generatedAt}`,
  `- repository: \`${params.repo}\``,
  `- verdict: ${params.verdict}`,
  '',
];

export const buildConsumerStartupUnblockInputLines = (params: {
  supportBundlePath: string;
  authReportPath: string;
  workflowLintReportPath: string;
  hasSupportBundle: boolean;
  hasAuthReport: boolean;
  hasWorkflowLintReport: boolean;
}): ReadonlyArray<string> => [
  '## Inputs',
  '',
  `- support_bundle: \`${params.supportBundlePath}\` (${params.hasSupportBundle ? 'found' : 'missing'})`,
  `- auth_report: \`${params.authReportPath}\` (${params.hasAuthReport ? 'found' : 'missing'})`,
  `- workflow_lint_report: \`${params.workflowLintReportPath}\` (${params.hasWorkflowLintReport ? 'found' : 'missing, optional'})`,
  '',
];

export const buildConsumerStartupUnblockSignalLines = (
  summary: ConsumerStartupUnblockSummary
): ReadonlyArray<string> => [
  '## Signals',
  '',
  `- startup_failure_runs: ${summary.startupFailureRuns ?? 'unknown'}`,
  `- startup_stalled_runs: ${summary.startupStalledRuns ?? 'unknown'}`,
  `- auth_verdict: ${summary.authVerdict ?? 'unknown'}`,
  `- missing_user_scope: ${summary.missingUserScope ? 'yes' : 'no'}`,
  `- workflow_lint_findings: ${summary.lintFindingsCount}`,
  '',
];

export const buildConsumerStartupUnblockBlockerLines = (
  summary: ConsumerStartupUnblockSummary
): ReadonlyArray<string> => {
  if (summary.blockers.length === 0) {
    return ['## Blockers', '', '- none', ''];
  }

  return ['## Blockers', '', ...summary.blockers.map((blocker) => `- ${blocker}`), ''];
};
