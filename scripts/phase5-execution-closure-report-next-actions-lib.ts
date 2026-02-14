import type { Phase5ExecutionClosureExecution } from './phase5-execution-closure-report-contract';

export const appendPhase5ExecutionClosureNextActionLines = (params: {
  lines: string[];
  requiredFailures: ReadonlyArray<Phase5ExecutionClosureExecution>;
}): void => {
  params.lines.push('## Next Actions');
  params.lines.push('');
  if (params.requiredFailures.length === 0) {
    params.lines.push('- Closure run completed. Review generated reports and attach artifact links.');
  } else {
    for (const failure of params.requiredFailures) {
      params.lines.push(
        `- Resolve failed required step \`${failure.command.id}\` and rerun this command.`
      );
    }
  }
  params.lines.push('');
};
