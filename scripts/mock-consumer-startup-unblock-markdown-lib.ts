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
