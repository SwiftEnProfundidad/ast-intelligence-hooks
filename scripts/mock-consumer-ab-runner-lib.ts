import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { assessSmokeSummary, isExpectedModeResult } from './mock-consumer-smoke-lib';
import { assessEvidenceFile, buildMockConsumerAbMarkdown } from './mock-consumer-ab-report-lib';
import type { MockConsumerAbCliOptions } from './mock-consumer-ab-contract';
import type { MockConsumerAbVerdict } from './mock-consumer-ab-markdown-contract';

export const buildMockConsumerAbReportFromOptions = (params: {
  options: MockConsumerAbCliOptions;
  generatedAt: string;
}): { markdown: string; verdict: MockConsumerAbVerdict } => {
  const blockAssessment = assessSmokeSummary('block', params.options.blockSummaryFile);
  const minimalAssessment = assessSmokeSummary('minimal', params.options.minimalSummaryFile);
  const blockEvidenceAssessment = assessEvidenceFile(params.options.blockEvidenceFile);
  const minimalEvidenceAssessment = assessEvidenceFile(params.options.minimalEvidenceFile);

  const blockReady = isExpectedModeResult(blockAssessment);
  const minimalReady = isExpectedModeResult(minimalAssessment);

  const report = buildMockConsumerAbMarkdown({
    generatedAt: params.generatedAt,
    repo: params.options.repo,
    blockSummaryFile: params.options.blockSummaryFile,
    minimalSummaryFile: params.options.minimalSummaryFile,
    blockEvidenceFile: params.options.blockEvidenceFile,
    minimalEvidenceFile: params.options.minimalEvidenceFile,
    blockReady,
    minimalReady,
    blockEvidence: blockEvidenceAssessment,
    minimalEvidence: minimalEvidenceAssessment,
  });

  return {
    markdown: report.markdown,
    verdict: report.verdict,
  };
};

export const persistMockConsumerAbReport = (params: {
  outFile: string;
  markdown: string;
  dryRun: boolean;
}): void => {
  if (params.dryRun) {
    return;
  }

  const outPath = resolve(process.cwd(), params.outFile);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, params.markdown, 'utf8');
};
