import { resolve } from 'node:path';
import type {
  ConsumerWorkflowLintCliOptions,
  ConsumerWorkflowLintResult,
} from './consumer-workflow-lint-contract';

export const buildConsumerWorkflowLintMarkdown = (params: {
  options: ConsumerWorkflowLintCliOptions;
  lintResult: ConsumerWorkflowLintResult;
  generatedAtIso?: string;
}): string => {
  const now = params.generatedAtIso ?? new Date().toISOString();
  const lines: string[] = [];
  lines.push('# Consumer Workflow Lint Report');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- repo_path: \`${resolve(params.options.repoPath)}\``);
  lines.push(`- actionlint_bin: \`${params.options.actionlintBin}\``);
  lines.push(`- workflow_glob: \`${params.lintResult.workflowPath}\``);
  lines.push(`- exit_code: ${params.lintResult.exitCode}`);
  lines.push('');

  if (params.lintResult.output.trim().length === 0) {
    lines.push('## Result');
    lines.push('');
    lines.push('- No issues reported by actionlint.');
    lines.push('');
    return `${lines.join('\n')}\n`;
  }

  lines.push('## Raw Output');
  lines.push('');
  lines.push('```text');
  lines.push(params.lintResult.output.trimEnd());
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
};
