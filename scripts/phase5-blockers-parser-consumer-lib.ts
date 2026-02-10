import type { ParsedConsumerStartupTriageReport } from './phase5-blockers-contract';
import { dedupePhase5BlockersValues } from './phase5-blockers-contract';

const parseConsumerTriageVerdict = (
  markdown: string
): ParsedConsumerStartupTriageReport['verdict'] => {
  const verdictRaw = markdown
    .match(/- verdict:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  return verdictRaw === 'READY' || verdictRaw === 'BLOCKED'
    ? (verdictRaw as 'READY' | 'BLOCKED')
    : undefined;
};

const parseConsumerTriageFailedSteps = (markdown: string): ReadonlyArray<string> => {
  return dedupePhase5BlockersValues(
    (markdown.match(/Resolve failed required step `([^`]+)`/g) ?? [])
      .map((line) => line.match(/`([^`]+)`/)?.[1]?.trim())
      .filter((value): value is string => Boolean(value))
  );
};

export const parseConsumerStartupTriageReport = (
  markdown: string
): ParsedConsumerStartupTriageReport => {
  return {
    verdict: parseConsumerTriageVerdict(markdown),
    requiredFailedSteps: parseConsumerTriageFailedSteps(markdown),
  };
};
