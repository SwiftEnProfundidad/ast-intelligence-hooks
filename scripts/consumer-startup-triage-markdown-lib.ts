import type {
  ConsumerStartupTriageCommand,
  ConsumerStartupTriageExecution,
} from './consumer-startup-triage-contract';

export const buildConsumerStartupTriageReportMarkdown = (params: {
  generatedAt: string;
  repo: string;
  outDir: string;
  commands: ReadonlyArray<ConsumerStartupTriageCommand>;
  executions: ReadonlyArray<ConsumerStartupTriageExecution>;
}): string => {
  const lines: string[] = [];

  const requiredFailures = params.executions.filter(
    (entry) => entry.command.required && !entry.ok
  );

  lines.push('# Consumer Startup Triage Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAt}`);
  lines.push(`- target_repo: \`${params.repo}\``);
  lines.push(`- output_directory: \`${params.outDir}\``);
  lines.push(`- verdict: ${requiredFailures.length === 0 ? 'READY' : 'BLOCKED'}`);
  lines.push('');

  lines.push('## Executions');
  lines.push('');
  lines.push('| id | required | exit_code | status | output |');
  lines.push('| --- | --- | --- | --- | --- |');

  for (const execution of params.executions) {
    lines.push(
      `| ${execution.command.id} | ${execution.command.required ? 'yes' : 'no'} | ${execution.exitCode} | ${execution.ok ? 'ok' : 'failed'} | \`${execution.command.outputFile}\` |`
    );
  }
  lines.push('');

  lines.push('## Command Plan');
  lines.push('');
  for (const command of params.commands) {
    lines.push(`- ${command.id}: ${command.description}`);
    lines.push(
      `  - run: \`npx --yes tsx@4.21.0 ${command.script} ${command.args.join(' ')}\``
    );
  }
  lines.push('');

  lines.push('## Next Actions');
  lines.push('');
  if (requiredFailures.length === 0) {
    lines.push('- Triage outputs are ready for review and escalation workflow.');
  } else {
    for (const failure of requiredFailures) {
      lines.push(
        `- Resolve failed required step \`${failure.command.id}\` and rerun startup triage.`
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
