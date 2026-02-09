import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Phase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';
import { parseVerdictFromMarkdown } from './phase5-execution-closure-status-lib';

type MarkdownInput = {
  exists: boolean;
  content?: string;
};

export type Phase5ExternalHandoffInputs = {
  phase5StatusReport: MarkdownInput;
  phase5BlockersReport: MarkdownInput;
  consumerUnblockReport: MarkdownInput;
  mockAbReport: MarkdownInput;
  runReport: MarkdownInput;
};

export type Phase5ExternalHandoffVerdicts = {
  phase5StatusVerdict?: string;
  phase5BlockersVerdict?: string;
  consumerUnblockVerdict?: string;
  mockAbVerdict?: string;
  runReportVerdict?: string;
};

const readMarkdownIfExists = (pathLike: string): MarkdownInput => {
  const absolute = resolve(process.cwd(), pathLike);
  if (!existsSync(absolute)) {
    return { exists: false };
  }
  return {
    exists: true,
    content: readFileSync(absolute, 'utf8'),
  };
};

export const loadPhase5ExternalHandoffInputs = (
  options: Phase5ExternalHandoffCliOptions
): Phase5ExternalHandoffInputs => {
  return {
    phase5StatusReport: readMarkdownIfExists(options.phase5StatusReportFile),
    phase5BlockersReport: readMarkdownIfExists(options.phase5BlockersReportFile),
    consumerUnblockReport: readMarkdownIfExists(options.consumerUnblockReportFile),
    mockAbReport: readMarkdownIfExists(options.mockAbReportFile),
    runReport: readMarkdownIfExists(options.runReportFile),
  };
};

const resolveMarkdownVerdict = (content?: string): string | undefined => {
  return content ? parseVerdictFromMarkdown(content) : undefined;
};

export const resolvePhase5ExternalHandoffVerdicts = (
  inputs: Phase5ExternalHandoffInputs
): Phase5ExternalHandoffVerdicts => {
  return {
    phase5StatusVerdict: resolveMarkdownVerdict(inputs.phase5StatusReport.content),
    phase5BlockersVerdict: resolveMarkdownVerdict(inputs.phase5BlockersReport.content),
    consumerUnblockVerdict: resolveMarkdownVerdict(inputs.consumerUnblockReport.content),
    mockAbVerdict: resolveMarkdownVerdict(inputs.mockAbReport.content),
    runReportVerdict: resolveMarkdownVerdict(inputs.runReport.content),
  };
};
