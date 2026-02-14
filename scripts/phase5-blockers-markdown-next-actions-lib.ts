import type { Phase5BlockersSummary } from './phase5-blockers-contract';
import { appendPhase5BlockersBlockedNextActions } from './phase5-blockers-markdown-next-actions-blocked-lib';
import { appendPhase5BlockersReadyNextActions } from './phase5-blockers-markdown-next-actions-ready-lib';

export const appendPhase5BlockersNextActionsSection = (params: {
  lines: string[];
  summary: Phase5BlockersSummary;
  hasAdapterReport: boolean;
  hasConsumerTriageReport: boolean;
  requireAdapterReport: boolean;
}): void => {
  params.lines.push('## Next Actions');
  params.lines.push('');
  if (params.summary.verdict === 'READY') {
    appendPhase5BlockersReadyNextActions({
      lines: params.lines,
      hasAdapterReport: params.hasAdapterReport,
    });
    return;
  }

  appendPhase5BlockersBlockedNextActions({
    lines: params.lines,
    summary: params.summary,
    hasAdapterReport: params.hasAdapterReport,
    hasConsumerTriageReport: params.hasConsumerTriageReport,
    requireAdapterReport: params.requireAdapterReport,
  });
};
