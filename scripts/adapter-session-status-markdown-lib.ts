import type { BuildAdapterSessionStatusMarkdownParams } from './adapter-session-status-contract';

const markdownEscapeFence = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

export const buildAdapterSessionStatusMarkdown = (
  params: BuildAdapterSessionStatusMarkdownParams
): string => {
  const lines: string[] = [];
  const verifyResult = params.commands.find(
    (command) => command.label === 'verify-adapter-hooks-runtime'
  );
  const hasAvailableSessionProbe = params.commands.some(
    (command) =>
      (command.label === 'assess-adapter-hooks-session' ||
        command.label === 'assess-adapter-hooks-session:any') &&
      command.availability === 'available'
  );

  lines.push('# Adapter Session Status Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAtIso}`);
  lines.push(`- verdict: ${params.verdict}`);
  lines.push(`- tail_lines: ${params.options.tailLines}`);
  lines.push('');

  lines.push('## Commands');
  lines.push('');
  lines.push('| step | command | availability | exit_code |');
  lines.push('| --- | --- | --- | --- |');
  for (const command of params.commands) {
    const exitCode =
      typeof command.exitCode === 'number' ? String(command.exitCode) : 'n/a';
    lines.push(
      `| ${command.label} | \`${command.command}\` | ${command.availability} | ${exitCode} |`
    );
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
    if (!hasAvailableSessionProbe) {
      lines.push('- Runtime verification is available, but this consumer does not expose direct session assessment probes.');
      lines.push('- Next: treat this as advisory evidence only, or run deeper adapter diagnostics from the Pumuki source workspace.');
    } else {
      lines.push('- Runtime wiring appears healthy, but strict assessment did not observe real IDE events yet.');
      lines.push('- Next: execute a real Adapter write session and regenerate this report.');
    }
  } else {
    if (verifyResult?.availability === 'unavailable') {
      lines.push('- This consumer does not expose a runnable adapter runtime verification probe.');
      lines.push('- Next: do not treat this report as authoritative until the consumer provides explicit adapter diagnostics commands.');
    } else {
      lines.push('- Runtime verification and/or session assessments are failing.');
      lines.push('- Next: fix adapter runtime wiring or rerun diagnostics from the Pumuki source workspace if consumer probes are incomplete.');
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
