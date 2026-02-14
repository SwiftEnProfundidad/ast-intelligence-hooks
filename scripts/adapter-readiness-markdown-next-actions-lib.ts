import type { BuildAdapterReadinessMarkdownParams } from './adapter-readiness-contract';

const hasAdapterRuntimeBlocker = (source: BuildAdapterReadinessMarkdownParams): boolean =>
  source.summary.blockers.some(
    (item) =>
      item.includes('Adapter adapter validation') || item.includes('node: command not found')
  );

export const appendAdapterReadinessNextActionsSection = (params: {
  lines: string[];
  source: BuildAdapterReadinessMarkdownParams;
}): void => {
  params.lines.push('## Next Actions');
  params.lines.push('');
  if (params.source.summary.verdict === 'READY') {
    params.lines.push('- Adapter diagnostics are healthy.');
    params.lines.push('- Keep this report attached to rollout validation evidence.');
    params.lines.push('');
    return;
  }

  if (!params.source.hasAdapterReport) {
    params.lines.push(
      '- Generate Adapter report: `npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`'
    );
  }
  if (hasAdapterRuntimeBlocker(params.source)) {
    params.lines.push(
      '- Execute `docs/validation/adapter-hook-runtime-validation.md`, then regenerate adapter readiness report.'
    );
  }
  params.lines.push('');
};
