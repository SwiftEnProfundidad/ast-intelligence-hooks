import type { Phase5BlockersSummary } from './phase5-blockers-contract';
import {
  appendPhase5BlockersHeaderSection,
  appendPhase5BlockersInputsSection,
  appendPhase5BlockersSignalsSection,
} from './phase5-blockers-markdown-header-inputs-signals-lib';
import { appendPhase5BlockersListValues } from './phase5-blockers-markdown-list-utils-lib';

export {
  appendPhase5BlockersHeaderSection,
  appendPhase5BlockersInputsSection,
  appendPhase5BlockersSignalsSection,
};

export const appendPhase5BlockersListSection = (params: {
  lines: string[];
  summary: Phase5BlockersSummary;
}): void => {
  params.lines.push('## Blockers');
  params.lines.push('');
  appendPhase5BlockersListValues({
    lines: params.lines,
    values: params.summary.blockers,
  });
  params.lines.push('');
};
