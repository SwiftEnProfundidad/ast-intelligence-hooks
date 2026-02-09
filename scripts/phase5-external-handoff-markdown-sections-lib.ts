import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';

const appendListSection = (params: {
  lines: string[];
  title: string;
  values: ReadonlyArray<string>;
}): void => {
  params.lines.push(params.title);
  params.lines.push('');
  if (params.values.length === 0) {
    params.lines.push('- none');
  } else {
    for (const value of params.values) {
      params.lines.push(`- ${value}`);
    }
  }
  params.lines.push('');
};

export const appendInputsSection = (params: {
  lines: string[];
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
}): void => {
  params.lines.push('## Inputs');
  params.lines.push('');
  params.lines.push(
    `- phase5_status_report: \`${params.phase5StatusReportPath}\` (${params.hasPhase5StatusReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- phase5_blockers_report: \`${params.phase5BlockersReportPath}\` (${params.hasPhase5BlockersReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- consumer_unblock_report: \`${params.consumerUnblockReportPath}\` (${params.hasConsumerUnblockReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- mock_ab_report: \`${params.mockAbReportPath}\` (${params.hasMockAbReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- phase5_run_report: \`${params.runReportPath}\` (${params.hasRunReport ? 'found' : 'missing'})`
  );
  params.lines.push(
    `- require_mock_ab_report: ${params.summary.requireMockAbReport ? 'YES' : 'NO'}`
  );
  params.lines.push(
    `- require_artifact_urls: ${params.summary.requireArtifactUrls ? 'YES' : 'NO'}`
  );
  params.lines.push('');
};

export const appendParsedVerdictsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  params.lines.push('## Parsed Verdicts');
  params.lines.push('');
  params.lines.push(`- phase5_status: ${params.summary.phase5StatusVerdict ?? 'unknown'}`);
  params.lines.push(`- phase5_blockers: ${params.summary.phase5BlockersVerdict ?? 'unknown'}`);
  params.lines.push(`- consumer_unblock: ${params.summary.consumerUnblockVerdict ?? 'unknown'}`);
  params.lines.push(`- mock_ab: ${params.summary.mockAbVerdict ?? 'unknown'}`);
  params.lines.push(`- phase5_run_report: ${params.summary.runReportVerdict ?? 'unknown'}`);
  params.lines.push('');
};

export const appendArtifactUrlsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendListSection({
    lines: params.lines,
    title: '## Artifact URLs',
    values: params.summary.artifactUrls,
  });
};

export const appendMissingInputsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendListSection({
    lines: params.lines,
    title: '## Missing Inputs',
    values: params.summary.missingInputs,
  });
};

export const appendBlockersSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendListSection({
    lines: params.lines,
    title: '## Blockers',
    values: params.summary.blockers,
  });
};

export const appendWarningsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendListSection({
    lines: params.lines,
    title: '## Warnings',
    values: params.summary.warnings,
  });
};

export const appendNextActionsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  params.lines.push('## Next Actions');
  params.lines.push('');
  if (params.summary.verdict === 'READY') {
    params.lines.push('- External handoff packet is ready to attach to rollout tracker.');
    params.lines.push('- Share this report and referenced artifact URLs with consumer owners.');
  } else {
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
  }
  params.lines.push('');
};
