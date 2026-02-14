import type { BuildPhase5ExecutionClosureStatusMarkdownParams } from './phase5-execution-closure-status-contract';
import {
  appendPhase5ExecutionClosureStatusFindings,
  appendPhase5ExecutionClosureStatusHeader,
  appendPhase5ExecutionClosureStatusInputs,
  appendPhase5ExecutionClosureStatusNextActions,
  appendPhase5ExecutionClosureStatusVerdicts,
} from './phase5-execution-closure-status-markdown-sections-lib';

export const buildPhase5ExecutionClosureStatusMarkdown = (
  params: BuildPhase5ExecutionClosureStatusMarkdownParams
): string => {
  const lines: string[] = [];

  appendPhase5ExecutionClosureStatusHeader(lines, params);
  appendPhase5ExecutionClosureStatusInputs(lines, params);
  appendPhase5ExecutionClosureStatusVerdicts(lines, params.summary);
  appendPhase5ExecutionClosureStatusFindings(lines, params.summary);
  appendPhase5ExecutionClosureStatusNextActions(lines, params.summary);

  return `${lines.join('\n')}\n`;
};
