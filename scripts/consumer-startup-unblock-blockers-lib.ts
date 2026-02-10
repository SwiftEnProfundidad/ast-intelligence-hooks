import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-parser-lib';
import type { ParsedWorkflowLintReport } from './consumer-startup-unblock-contract';
import { parseConsumerStartupUnblockInteger } from './consumer-startup-unblock-contract';
import { hasConsumerStartupUnblockUserScopeGap } from './consumer-startup-unblock-auth-lib';

export const collectConsumerStartupUnblockBlockers = (params: {
  support?: ParsedSupportBundle;
  auth?: ParsedAuthReport;
  workflowLint?: ParsedWorkflowLintReport;
}): {
  blockers: string[];
  startupFailureRuns?: number;
  authVerdict?: string;
  missingUserScope: boolean;
  lintFindingsCount: number;
} => {
  const blockers: string[] = [];

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

  const missingUserScope = hasConsumerStartupUnblockUserScopeGap(params.auth);
  if (missingUserScope) {
    blockers.push('Missing user scope for billing/account diagnostics');
  }

  const lintFindingsCount = params.workflowLint?.findingsCount ?? 0;
  if (lintFindingsCount > 0) {
    blockers.push(`Workflow lint report still has findings (${lintFindingsCount})`);
  }

  return {
    blockers,
    startupFailureRuns,
    authVerdict,
    missingUserScope,
    lintFindingsCount,
  };
};
