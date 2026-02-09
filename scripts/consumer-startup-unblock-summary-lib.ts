import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-lib';
import type {
  ConsumerStartupUnblockSummary,
  ParsedWorkflowLintReport,
} from './consumer-startup-unblock-contract';
import { parseConsumerStartupUnblockInteger } from './consumer-startup-unblock-contract';

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

  const startupFailureRuns = parseConsumerStartupUnblockInteger(
    params.support?.startupFailureRuns
  );
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
