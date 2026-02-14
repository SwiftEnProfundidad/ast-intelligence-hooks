import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';

export type AdapterRealSessionSignals = {
  preWriteObserved: boolean;
  postWriteObserved: boolean;
  nodeBinResolved: boolean;
  nodeCommandMissing: boolean;
  normalWriteTriggered: boolean;
  blockedWriteTriggered: boolean;
  strictNodeTriggered: boolean;
};

export const collectAdapterRealSessionSignals = (
  params: AdapterRealSessionReportParams
): AdapterRealSessionSignals => {
  const combinedCorpus = [
    params.statusReport,
    params.runtimeLogContent,
    params.smokeLogContent,
    params.hookLogContent,
    params.writesLogContent,
  ]
    .filter((chunk): chunk is string => Boolean(chunk))
    .join('\n');

  const hasPositiveCounter = (pattern: RegExp): boolean => {
    const match = combinedCorpus.match(pattern);
    if (!match?.[1]) {
      return false;
    }

    const value = Number.parseInt(match[1], 10);
    return Number.isFinite(value) && value > 0;
  };

  const preWriteObserved =
    /pre_write_code/.test(combinedCorpus) ||
    hasPositiveCounter(/pre_write\.(?:analyzing|blocked|allowed)_effective=(\d+)/);
  const postWriteObserved =
    /post_write_code/.test(combinedCorpus) ||
    hasPositiveCounter(/post_write\.entries_effective=(\d+)/);
  const nodeBinResolved = /node_bin\s*=/.test(combinedCorpus);
  const nodeCommandMissing = /(?:bash:\s*)?node:\s*command not found/.test(combinedCorpus);

  const hookLog = params.hookLogContent ?? '';
  const normalWriteTriggered = /ALLOWED:/.test(hookLog);
  const blockedWriteTriggered = /BLOCKED:/.test(hookLog);
  const strictNodeTriggered = params.parsedStatus.strictAssessmentPass;

  return {
    preWriteObserved,
    postWriteObserved,
    nodeBinResolved,
    nodeCommandMissing,
    normalWriteTriggered,
    blockedWriteTriggered,
    strictNodeTriggered,
  };
};
