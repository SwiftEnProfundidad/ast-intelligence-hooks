import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-lib';

export type ParsedWorkflowLintReport = {
  exitCode?: number;
  findingsCount: number;
  findings: ReadonlyArray<string>;
};

export type ConsumerStartupUnblockSummary = {
  verdict: 'READY_FOR_RETEST' | 'BLOCKED' | 'MISSING_INPUTS';
  blockers: ReadonlyArray<string>;
  startupFailureRuns?: number;
  authVerdict?: string;
  missingUserScope: boolean;
  lintFindingsCount: number;
};

const dedupe = (values: ReadonlyArray<string>): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }

  return output;
};

const parseInteger = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parseWorkflowLintReport = (markdown: string): ParsedWorkflowLintReport => {
  const exitCode = parseInteger(
    markdown.match(/- exit_code:\s*([0-9]+)/)?.[1]
  );

  const findings = dedupe(
    markdown
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /\[[a-z-]+\]\s*$/.test(line))
  );

  return {
    exitCode,
    findingsCount: findings.length,
    findings,
  };
};

const hasUserScopeGap = (auth?: ParsedAuthReport): boolean => {
  const missingScopes = (auth?.missingScopes ?? '')
    .toLowerCase()
    .split(',')
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);

  if (missingScopes.includes('user')) {
    return true;
  }

  const billingError = (auth?.billingError ?? '').toLowerCase();
  return billingError.includes('user scope') || billingError.includes('"user" scope');
};

export const summarizeConsumerStartupUnblock = (params: {
  hasSupportBundle: boolean;
  hasAuthReport: boolean;
  support?: ParsedSupportBundle;
  auth?: ParsedAuthReport;
  workflowLint?: ParsedWorkflowLintReport;
}): ConsumerStartupUnblockSummary => {
  const blockers: string[] = [];
  const missingInputs: string[] = [];

  if (!params.hasSupportBundle) {
    missingInputs.push('Missing support bundle report');
  }
  if (!params.hasAuthReport) {
    missingInputs.push('Missing auth check report');
  }

  if (missingInputs.length > 0) {
    return {
      verdict: 'MISSING_INPUTS',
      blockers: missingInputs,
      startupFailureRuns: undefined,
      authVerdict: params.auth?.verdict,
      missingUserScope: hasUserScopeGap(params.auth),
      lintFindingsCount: params.workflowLint?.findingsCount ?? 0,
    };
  }

  const startupFailureRuns = parseInteger(params.support?.startupFailureRuns);
  if (startupFailureRuns === undefined) {
    blockers.push('Unable to determine startup_failure_runs from support bundle');
  } else if (startupFailureRuns > 0) {
    blockers.push(`Startup failures still present (${startupFailureRuns})`);
  }

  const authVerdict = params.auth?.verdict?.trim();
  if (authVerdict && authVerdict.toUpperCase() !== 'READY') {
    blockers.push(`Auth report verdict is ${authVerdict}`);
  }

  const missingUserScope = hasUserScopeGap(params.auth);
  if (missingUserScope) {
    blockers.push('Missing user scope for billing/account diagnostics');
  }

  const lintFindingsCount = params.workflowLint?.findingsCount ?? 0;
  if (lintFindingsCount > 0) {
    blockers.push(`Workflow lint report still has findings (${lintFindingsCount})`);
  }

  return {
    verdict: blockers.length === 0 ? 'READY_FOR_RETEST' : 'BLOCKED',
    blockers,
    startupFailureRuns,
    authVerdict,
    missingUserScope,
    lintFindingsCount,
  };
};

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
