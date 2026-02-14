import type { Phase5ExecutionClosureSummary } from './phase5-execution-closure-status-contract';

export const appendPhase5ExecutionClosureStatusNextActions = (
  lines: string[],
  summary: Phase5ExecutionClosureSummary
): void => {
  lines.push('## Next Actions');
  lines.push('');
  if (summary.verdict === 'READY') {
    lines.push('- Phase 5 execution closure criteria are satisfied.');
    lines.push('- Archive generated reports and update rollout tracker references.');
    lines.push('');
    return;
  }

  if (summary.verdict === 'MISSING_INPUTS') {
    lines.push('- Generate missing reports first, then re-run this status command.');
  }
  if (summary.verdict === 'BLOCKED') {
    lines.push('- Resolve blockers from report inputs and regenerate reports.');
  }
  lines.push('- Re-run: `npm run validation:phase5-execution-closure-status`.');
  lines.push('');
};
