import type { BuildPhase5ExecutionClosureStatusMarkdownParams } from './phase5-execution-closure-status-contract';

export const buildPhase5ExecutionClosureStatusMarkdown = (
  params: BuildPhase5ExecutionClosureStatusMarkdownParams
): string => {
  const lines: string[] = [];

  lines.push('# Phase 5 Execution Closure Status');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- phase5_blockers_report: \`${params.phase5BlockersReportPath}\` (${params.hasPhase5BlockersReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- consumer_unblock_report: \`${params.consumerUnblockReportPath}\` (${params.hasConsumerUnblockReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- adapter_readiness_report: \`${params.adapterReadinessReportPath}\` (${params.hasAdapterReadinessReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- adapter_readiness_required: ${params.summary.requireAdapterReadiness ? 'YES' : 'NO'}`
  );
  lines.push('');

  lines.push('## Parsed Verdicts');
  lines.push('');
  lines.push(`- phase5_blockers: ${params.summary.phase5BlockersVerdict ?? 'unknown'}`);
  lines.push(`- consumer_unblock: ${params.summary.consumerUnblockVerdict ?? 'unknown'}`);
  lines.push(`- adapter_readiness: ${params.summary.adapterReadinessVerdict ?? 'unknown'}`);
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

  lines.push('## Warnings');
  lines.push('');
  if (params.summary.warnings.length === 0) {
    lines.push('- none');
  } else {
    for (const warning of params.summary.warnings) {
      lines.push(`- ${warning}`);
    }
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (params.summary.verdict === 'READY') {
    lines.push('- Phase 5 execution closure criteria are satisfied.');
    lines.push('- Archive generated reports and update rollout tracker references.');
  } else {
    if (params.summary.verdict === 'MISSING_INPUTS') {
      lines.push('- Generate missing reports first, then re-run this status command.');
    }
    if (params.summary.verdict === 'BLOCKED') {
      lines.push('- Resolve blockers from report inputs and regenerate reports.');
    }
    lines.push('- Re-run: `npm run validation:phase5-execution-closure-status`.');
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
