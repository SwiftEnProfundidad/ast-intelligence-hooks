import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  assessSmokeSummary,
  isExpectedModeResult,
} from './mock-consumer-smoke-lib';
import {
  assessEvidenceFile,
  buildMockConsumerAbMarkdown,
  parseMockConsumerAbArgs,
} from './mock-consumer-ab-report-lib';

const main = (): number => {
  try {
    const options = parseMockConsumerAbArgs(process.argv.slice(2));
    const generatedAt = new Date().toISOString();

    const blockAssessment = assessSmokeSummary('block', options.blockSummaryFile);
    const minimalAssessment = assessSmokeSummary('minimal', options.minimalSummaryFile);
    const blockEvidenceAssessment = assessEvidenceFile(options.blockEvidenceFile);
    const minimalEvidenceAssessment = assessEvidenceFile(options.minimalEvidenceFile);

    const blockReady = isExpectedModeResult(blockAssessment);
    const minimalReady = isExpectedModeResult(minimalAssessment);

    const report = buildMockConsumerAbMarkdown({
      generatedAt,
      repo: options.repo,
      blockSummaryFile: options.blockSummaryFile,
      minimalSummaryFile: options.minimalSummaryFile,
      blockEvidenceFile: options.blockEvidenceFile,
      minimalEvidenceFile: options.minimalEvidenceFile,
      blockReady,
      minimalReady,
      blockEvidence: blockEvidenceAssessment,
      minimalEvidence: minimalEvidenceAssessment,
    });

    const outPath = resolve(process.cwd(), options.outFile);

    if (!options.dryRun) {
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, report.markdown, 'utf8');
    }

    const mode = options.dryRun ? 'dry-run' : 'write';
    console.log(
      `[build-mock-consumer-ab-report] ${mode} verdict=${report.verdict} out=${options.outFile}`
    );

    return report.verdict === 'READY' ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[build-mock-consumer-ab-report] error: ${message}`);
    return 1;
  }
};

process.exit(main());
