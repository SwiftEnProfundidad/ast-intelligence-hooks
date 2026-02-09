import type {
  ParsedAdapterRealSessionReport,
  ParsedConsumerStartupTriageReport,
} from './phase5-blockers-contract';
import { dedupePhase5BlockersValues } from './phase5-blockers-contract';

export const parseAdapterRealSessionReport = (
  markdown: string
): ParsedAdapterRealSessionReport => {
  const validationRaw = markdown
    .match(/- Validation result:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const reTestRaw = markdown
    .match(/- Re-test required:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const validationResult =
    validationRaw === 'PASS' || validationRaw === 'FAIL'
      ? (validationRaw as 'PASS' | 'FAIL')
      : undefined;

  const reTestRequired =
    reTestRaw === 'YES' ? true : reTestRaw === 'NO' ? false : undefined;

  const runtimeNodeRaw = markdown
    .match(/- Any `bash: node: command not found`:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const nodeCommandNotFound =
    runtimeNodeRaw === 'YES'
      ? true
      : runtimeNodeRaw === 'NO'
        ? false
        : /node:\s*command not found/i.test(markdown);

  return {
    validationResult,
    reTestRequired,
    nodeCommandNotFound,
  };
};

export const parseConsumerStartupTriageReport = (
  markdown: string
): ParsedConsumerStartupTriageReport => {
  const verdictRaw = markdown
    .match(/- verdict:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const verdict =
    verdictRaw === 'READY' || verdictRaw === 'BLOCKED'
      ? (verdictRaw as 'READY' | 'BLOCKED')
      : undefined;

  const requiredFailedSteps = dedupePhase5BlockersValues(
    (markdown.match(/Resolve failed required step `([^`]+)`/g) ?? [])
      .map((line) => line.match(/`([^`]+)`/)?.[1]?.trim())
      .filter((value): value is string => Boolean(value))
  );

  return {
    verdict,
    requiredFailedSteps,
  };
};
