import type { ParsedAuthReport, ParsedSupportBundle } from './consumer-support-ticket-parser-lib';
import type {
  ConsumerStartupUnblockSummary,
  ParsedWorkflowLintReport,
} from './consumer-startup-unblock-contract';
import { collectConsumerStartupUnblockBlockers } from './consumer-startup-unblock-blockers-lib';
import { hasConsumerStartupUnblockUserScopeGap } from './consumer-startup-unblock-auth-lib';

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
      missingUserScope: hasConsumerStartupUnblockUserScopeGap(params.auth),
      lintFindingsCount: params.workflowLint?.findingsCount ?? 0,
    };
  }

  const summaryInputs = collectConsumerStartupUnblockBlockers({
    support: params.support,
    auth: params.auth,
    workflowLint: params.workflowLint,
  });
  blockers.push(...summaryInputs.blockers);

  return {
    verdict: blockers.length === 0 ? 'READY_FOR_RETEST' : 'BLOCKED',
    blockers,
    startupFailureRuns: summaryInputs.startupFailureRuns,
    authVerdict: summaryInputs.authVerdict,
    missingUserScope: summaryInputs.missingUserScope,
    lintFindingsCount: summaryInputs.lintFindingsCount,
  };
};
