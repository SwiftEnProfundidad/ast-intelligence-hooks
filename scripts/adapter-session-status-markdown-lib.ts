import type { BuildAdapterSessionStatusMarkdownParams } from './adapter-session-status-contract';

const markdownEscapeFence = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

export const buildAdapterSessionStatusMarkdown = (
  params: BuildAdapterSessionStatusMarkdownParams
): string => {
  const lines: string[] = [];

  lines.push('# Adapter Session Status Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAtIso}`);
  lines.push(`- verdict: ${params.verdict}`);
  lines.push(`- tail_lines: ${params.options.tailLines}`);
  lines.push('');

  lines.push('## Commands');
  lines.push('');
  lines.push('| step | command | exit_code |');
  lines.push('| --- | --- | --- |');
  for (const command of params.commands) {
    lines.push(`| ${command.label} | \`${command.command}\` | ${command.exitCode} |`);
  }
  lines.push('');

  lines.push('## Command Output');
  lines.push('');
  for (const command of params.commands) {
    lines.push(`### ${command.label}`);
    lines.push('');
    lines.push('```text');
    lines.push(markdownEscapeFence(command.output.trimEnd()));
    lines.push('```');
    lines.push('');
  }

  lines.push('## Audit Log Tails');
  lines.push('');
  for (const tail of params.tails) {
    lines.push(`### ${tail.title}`);
    lines.push('');
    lines.push(`- path: \`${tail.path}\``);
    lines.push('```text');
    lines.push(markdownEscapeFence(tail.content));
    lines.push('```');
    lines.push('');
  }

  lines.push('## Interpretation');
  lines.push('');
  if (params.verdict === 'PASS') {
    lines.push('- Real Adapter pre/post events are present in strict session assessment.');
  } else if (params.verdict === 'NEEDS_REAL_SESSION') {
    lines.push('- Runtime wiring appears healthy, but strict assessment did not observe real IDE events yet.');
    lines.push('- Next: execute a real Adapter write session and regenerate this report.');
  } else {
    lines.push('- Runtime verification and/or session assessments are failing.');
    lines.push('- Next: run `npm run install:adapter-hooks-config` and `npm run verify:adapter-hooks-runtime`, then retry.');
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
