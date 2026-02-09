import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-lib';
import type {
  ConsumerStartupUnblockSummary,
  ParsedWorkflowLintReport,
} from './consumer-startup-unblock-contract';

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
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push('# Consumer Startup Failure Unblock Status');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- repository: \`${params.repo}\``);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- support_bundle: \`${params.supportBundlePath}\` (${params.hasSupportBundle ? 'found' : 'missing'})`
  );
  lines.push(
    `- auth_report: \`${params.authReportPath}\` (${params.hasAuthReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- workflow_lint_report: \`${params.workflowLintReportPath}\` (${params.hasWorkflowLintReport ? 'found' : 'missing'})`
  );
  lines.push('');

  lines.push('## Signals');
  lines.push('');
  lines.push(`- startup_failure_runs: ${params.summary.startupFailureRuns ?? 'unknown'}`);
  lines.push(`- auth_verdict: ${params.summary.authVerdict ?? 'unknown'}`);
  lines.push(
    `- missing_user_scope: ${params.summary.missingUserScope ? 'yes' : 'no'}`
  );
  lines.push(`- workflow_lint_findings: ${params.summary.lintFindingsCount}`);
  lines.push('');

  lines.push('## Blockers');
  lines.push('');
  if (params.summary.blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of params.summary.blockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (params.summary.verdict === 'READY_FOR_RETEST') {
    lines.push('- Re-trigger workflow_dispatch in the consumer repository.');
    lines.push('- Capture run URL, jobs count, and artifact URLs.');
  } else {
    if (params.summary.missingUserScope) {
      lines.push('- Refresh token scope: `gh auth refresh -h github.com -s user`.');
    }
    if ((params.summary.startupFailureRuns ?? 1) > 0) {
      lines.push(
        '- Review repository/account Actions policy and billing constraints before rerun.'
      );
    }
    if (params.summary.lintFindingsCount > 0) {
      lines.push('- Fix workflow lint findings and rerun diagnostics.');
    }
    if (params.summary.verdict === 'MISSING_INPUTS') {
      lines.push('- Generate required inputs using validation helper commands.');
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
