import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';

export const appendPhase5ExternalHandoffNextActions = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  params.lines.push('## Next Actions');
  params.lines.push('');
  if (params.summary.verdict === 'READY') {
    params.lines.push('- External handoff packet is ready to attach to rollout tracker.');
    params.lines.push('- Share this report and referenced artifact URLs with consumer owners.');
    params.lines.push('');
    return;
  }

  if (params.summary.verdict === 'MISSING_INPUTS') {
    params.lines.push('- Generate missing reports and re-run this command.');
  }
  if (params.summary.verdict === 'BLOCKED') {
    params.lines.push('- Resolve blocking verdicts before external handoff.');
  }
  if (params.summary.artifactUrls.length === 0) {
    params.lines.push('- Attach artifact URLs from CI/workflow runs to complete handoff context.');
  }
  params.lines.push('- Re-run: `npm run validation:phase5-external-handoff`.');
  params.lines.push('');
};
