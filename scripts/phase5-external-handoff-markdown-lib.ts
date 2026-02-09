import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';

export const buildPhase5ExternalHandoffMarkdown = (params: {
  generatedAt: string;
  repo: string;
  phase5StatusReportPath: string;
  phase5BlockersReportPath: string;
  consumerUnblockReportPath: string;
  mockAbReportPath: string;
  runReportPath: string;
  hasPhase5StatusReport: boolean;
  hasPhase5BlockersReport: boolean;
  hasConsumerUnblockReport: boolean;
  hasMockAbReport: boolean;
  hasRunReport: boolean;
  summary: Phase5ExternalHandoffSummary;
}): string => {
  const lines: string[] = [];

  lines.push('# Phase 5 External Handoff Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- verdict: ${params.summary.verdict}`);
  lines.push('');

  lines.push('## Inputs');
  lines.push('');
  lines.push(
    `- phase5_status_report: \`${params.phase5StatusReportPath}\` (${params.hasPhase5StatusReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- phase5_blockers_report: \`${params.phase5BlockersReportPath}\` (${params.hasPhase5BlockersReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- consumer_unblock_report: \`${params.consumerUnblockReportPath}\` (${params.hasConsumerUnblockReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- mock_ab_report: \`${params.mockAbReportPath}\` (${params.hasMockAbReport ? 'found' : 'missing'})`
  );
  lines.push(
    `- phase5_run_report: \`${params.runReportPath}\` (${params.hasRunReport ? 'found' : 'missing'})`
  );
  lines.push(`- require_mock_ab_report: ${params.summary.requireMockAbReport ? 'YES' : 'NO'}`);
  lines.push(
    `- require_artifact_urls: ${params.summary.requireArtifactUrls ? 'YES' : 'NO'}`
  );
  lines.push('');

  lines.push('## Parsed Verdicts');
  lines.push('');
  lines.push(`- phase5_status: ${params.summary.phase5StatusVerdict ?? 'unknown'}`);
  lines.push(`- phase5_blockers: ${params.summary.phase5BlockersVerdict ?? 'unknown'}`);
  lines.push(`- consumer_unblock: ${params.summary.consumerUnblockVerdict ?? 'unknown'}`);
  lines.push(`- mock_ab: ${params.summary.mockAbVerdict ?? 'unknown'}`);
  lines.push(`- phase5_run_report: ${params.summary.runReportVerdict ?? 'unknown'}`);
  lines.push('');

  lines.push('## Artifact URLs');
  lines.push('');
  if (params.summary.artifactUrls.length === 0) {
    lines.push('- none');
  } else {
    for (const url of params.summary.artifactUrls) {
      lines.push(`- ${url}`);
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
    lines.push('- External handoff packet is ready to attach to rollout tracker.');
    lines.push('- Share this report and referenced artifact URLs with consumer owners.');
  } else {
    if (params.summary.verdict === 'MISSING_INPUTS') {
      lines.push('- Generate missing reports and re-run this command.');
    }
    if (params.summary.verdict === 'BLOCKED') {
      lines.push('- Resolve blocking verdicts before external handoff.');
    }
    if (params.summary.artifactUrls.length === 0) {
      lines.push('- Attach artifact URLs from CI/workflow runs to complete handoff context.');
    }
    lines.push('- Re-run: `npm run validation:phase5-external-handoff`.');
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
