export const appendPhase5BlockersReadyNextActions = (params: {
  lines: string[];
  hasAdapterReport: boolean;
}): void => {
  params.lines.push('- Phase 5 blockers are clear for execution closure.');
  params.lines.push('- Attach this report to release/rollout notes.');
  if (!params.hasAdapterReport) {
    params.lines.push(
      '- Optional: generate Adapter report for adapter diagnostics traceability (`npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`).'
    );
  }
  params.lines.push('');
};
