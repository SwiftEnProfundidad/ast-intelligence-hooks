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
  const jobsCount = parseConsumerStartupUnblockInteger(params.support?.jobsCount);
  const artifactsCount = parseConsumerStartupUnblockInteger(params.support?.artifactsCount);

  const startupFailureRuns = parseConsumerStartupUnblockInteger(
    params.support?.startupFailureRuns
  );
  const startupStalledRuns = parseConsumerStartupUnblockInteger(
    params.support?.startupStalledRuns
  );
  if (startupFailureRuns === undefined) {
    blockers.push('Unable to determine startup_failure_runs from support bundle');
  } else if (startupFailureRuns > 0) {
    blockers.push(`Startup failures still present (${startupFailureRuns})`);
  }
  if (startupStalledRuns !== undefined && startupStalledRuns > 0) {
    blockers.push(`Startup runs remain queued/stalled (${startupStalledRuns})`);
  }

  if (
    params.support?.runUrls?.length &&
    jobsCount === 0 &&
    artifactsCount === 0
  ) {
    blockers.push('Workflow runs are stuck before job graph creation (jobs=0, artifacts=0)');
  }

  const authVerdict = params.auth?.verdict?.trim();
  if (authVerdict && authVerdict.toUpperCase() !== 'READY') {
    blockers.push(`Auth report verdict is ${authVerdict}`);
  }

  const missingUserScope = hasConsumerStartupUnblockUserScopeGap(params.auth);

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
