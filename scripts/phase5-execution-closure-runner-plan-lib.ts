import type { Phase5ExecutionClosureCommand } from './phase5-execution-closure-lib';

export const buildPhase5ExecutionClosureDryRunPlan = (
  commands: ReadonlyArray<Phase5ExecutionClosureCommand>
): string => {
  const lines = ['phase5 execution closure dry-run plan:'];
  for (const command of commands) {
    lines.push(
      `- ${command.id}: npx --yes tsx@4.21.0 ${command.script} ${command.args.join(' ')}`
    );
  }

  return `${lines.join('\n')}\n`;
};
