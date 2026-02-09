import {
  isExpectedModeResult,
  type SmokeAssessment,
} from './mock-consumer-smoke-lib';

export const buildMockConsumerTriageMarkdown = (params: {
  generatedAt: string;
  repo: string;
  outDir: string;
  assessments: ReadonlyArray<SmokeAssessment>;
}): { markdown: string; verdict: 'READY' | 'BLOCKED'; failedSteps: string[] } => {
  const failedSteps = params.assessments
    .filter((assessment) => !isExpectedModeResult(assessment))
    .map((assessment) => `mock-package-smoke-${assessment.mode}`);

  const verdict: 'READY' | 'BLOCKED' = failedSteps.length === 0 ? 'READY' : 'BLOCKED';
  const lines: string[] = [];

  lines.push('# Consumer Startup Triage Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- output_directory: \`${params.outDir}\``);
  lines.push('- source: mock_consumer_package_smoke');
  lines.push(`- verdict: ${verdict}`);
  lines.push('');

  lines.push('## Executions');
  lines.push('');
  lines.push('| id | required | status | output |');
  lines.push('| --- | --- | --- | --- |');
  for (const assessment of params.assessments) {
    const id = `mock-package-smoke-${assessment.mode}`;
    const ok = isExpectedModeResult(assessment);
    lines.push(
      `| ${id} | yes | ${ok ? 'ok' : 'failed'} | \`${assessment.file}\` |`
    );
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (verdict === 'READY') {
    lines.push('- Triage outputs are ready for review and escalation workflow.');
  } else {
    for (const failedStep of failedSteps) {
      lines.push(`- Resolve failed required step \`${failedStep}\` and rerun startup triage.`);
    }
  }
  lines.push('');

  return {
    markdown: `${lines.join('\n')}\n`,
    verdict,
    failedSteps,
  };
};

export const buildMockConsumerUnblockMarkdown = (params: {
  generatedAt: string;
  repo: string;
  triageReportPath: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  triageVerdict: 'READY' | 'BLOCKED';
}): { markdown: string; verdict: 'READY_FOR_RETEST' | 'BLOCKED' } => {
  const verdict: 'READY_FOR_RETEST' | 'BLOCKED' =
    params.triageVerdict === 'READY' ? 'READY_FOR_RETEST' : 'BLOCKED';

  const lines: string[] = [];
  lines.push('# Consumer Startup Unblock Status');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- verdict: ${verdict}`);
  lines.push('');
  lines.push('## Inputs');
  lines.push('');
  lines.push(`- triage_report: \`${params.triageReportPath}\``);
  lines.push(`- smoke_block_summary: \`${params.blockSummaryFile}\``);
  lines.push(`- smoke_minimal_summary: \`${params.minimalSummaryFile}\``);
  lines.push('');
  lines.push('## Next Actions');
  lines.push('');
  if (verdict === 'READY_FOR_RETEST') {
    lines.push('- Startup unblock criteria are clear for retest in approved consumer context.');
  } else {
    lines.push('- Resolve mock package smoke failures and regenerate startup triage outputs.');
  }
  lines.push('');

  return {
    markdown: `${lines.join('\n')}\n`,
    verdict,
  };
};
