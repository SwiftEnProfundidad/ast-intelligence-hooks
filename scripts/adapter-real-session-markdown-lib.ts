import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import {
  collectAdapterRealSessionSignals,
  evaluateAdapterRealSessionSignals,
} from './adapter-real-session-analysis-lib';
import { buildAdapterRealSessionReportLines } from './adapter-real-session-markdown-sections-lib';
export { tailFromContent } from './adapter-real-session-markdown-snippets-lib';

export const buildAdapterRealSessionReportMarkdown = (
  params: AdapterRealSessionReportParams
): string => {
  const signals = collectAdapterRealSessionSignals(params);
  const evaluation = evaluateAdapterRealSessionSignals({
    report: params,
    signals,
  });

  const lines = buildAdapterRealSessionReportLines({
    report: params,
    signals,
    evaluation,
  });

  return `${lines.join('\n')}\n`;
};
