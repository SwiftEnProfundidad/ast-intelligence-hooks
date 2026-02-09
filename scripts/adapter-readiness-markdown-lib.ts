import type { BuildAdapterReadinessMarkdownParams } from './adapter-readiness-contract';

export const buildAdapterReadinessMarkdown = (
  params: BuildAdapterReadinessMarkdownParams
): string => {
  const lines: string[] = [];

  lines.push('# Adapter Readiness');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- adapter_report: \`${params.adapterReportPath}\` (${params.hasAdapterReport ? 'found' : 'missing'})`
  );
  lines.push('');

  lines.push('## Adapter Status');
  lines.push('');
  for (const adapter of params.summary.adapters) {
    lines.push(`- ${adapter.name}: ${adapter.status}`);
    for (const note of adapter.notes) {
      lines.push(`  - ${note}`);
    }
  }
  lines.push('');

  lines.push('## Missing Inputs');
  lines.push('');
  if (params.summary.missingInputs.length === 0) {
    lines.push('- none');
  } else {
    for (const missingInput of params.summary.missingInputs) {
      lines.push(`- ${missingInput}`);
    }
  }
  lines.push('');

  lines.push('## Blockers');
  lines.push('');
  if (params.summary.blockers.length === 0) {
    lines.push('- none');
  } else {
    for (const blocker of params.summary.blockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (params.summary.verdict === 'READY') {
    lines.push('- Adapter diagnostics are healthy.');
    lines.push('- Keep this report attached to rollout validation evidence.');
  } else {
    if (!params.hasAdapterReport) {
      lines.push(
        '- Generate Adapter report: `npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md`'
      );
    }
    if (
      params.summary.blockers.some(
        (item) =>
          item.includes('Adapter adapter validation') ||
          item.includes('node: command not found')
      )
    ) {
      lines.push(
        '- Execute `docs/validation/adapter-hook-runtime-validation.md`, then regenerate adapter readiness report.'
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
