import type { BuildAdapterReadinessMarkdownParams } from './adapter-readiness-contract';
import { appendAdapterReadinessNextActionsSection } from './adapter-readiness-markdown-next-actions-lib';
import {
  appendAdapterReadinessBlockersSection,
  appendAdapterReadinessHeaderSection,
  appendAdapterReadinessInputsSection,
  appendAdapterReadinessMissingInputsSection,
  appendAdapterReadinessStatusSection,
} from './adapter-readiness-markdown-sections-lib';

export const buildAdapterReadinessMarkdown = (
  params: BuildAdapterReadinessMarkdownParams
): string => {
  const lines: string[] = [];
  appendAdapterReadinessHeaderSection({
    lines,
    source: params,
  });
  appendAdapterReadinessInputsSection({
    lines,
    source: params,
  });
  appendAdapterReadinessStatusSection({
    lines,
    source: params,
  });
  appendAdapterReadinessMissingInputsSection({
    lines,
    source: params,
  });
  appendAdapterReadinessBlockersSection({
    lines,
    source: params,
  });
  appendAdapterReadinessNextActionsSection({
    lines,
    source: params,
  });

  return `${lines.join('\n')}\n`;
};
