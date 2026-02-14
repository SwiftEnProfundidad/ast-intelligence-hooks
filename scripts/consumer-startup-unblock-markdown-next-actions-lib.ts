import type { ConsumerStartupUnblockSummary } from './consumer-startup-unblock-contract';

export const buildConsumerStartupUnblockNextActionLines = (
  summary: ConsumerStartupUnblockSummary
): ReadonlyArray<string> => {
  if (summary.verdict === 'READY_FOR_RETEST') {
    return [
      '## Next Actions',
      '',
      '- Re-trigger workflow_dispatch in the consumer repository.',
      '- Capture run URL, jobs count, and artifact URLs.',
      '',
    ];
  }

  const lines: string[] = ['## Next Actions', ''];

  if (summary.missingUserScope) {
    lines.push(
      '- Optional: add `user` scope only if account-level billing diagnostics are needed.'
    );
  }
  if ((summary.startupFailureRuns ?? 1) > 0) {
    lines.push(
      '- Review repository/account Actions policy and billing constraints before rerun.'
    );
  }
  if (summary.lintFindingsCount > 0) {
    lines.push('- Fix workflow lint findings and rerun diagnostics.');
  }
  if (summary.verdict === 'MISSING_INPUTS') {
    lines.push('- Generate required inputs using validation helper commands.');
  }
  lines.push('');

  return lines;
};
