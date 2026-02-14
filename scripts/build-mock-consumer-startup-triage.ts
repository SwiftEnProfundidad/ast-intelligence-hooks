import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { resolveConsumerStartupTriageOutputs } from './consumer-startup-triage-lib';
import {
  assessSmokeSummary,
  type SmokeAssessment,
} from './mock-consumer-smoke-lib';
import { parseMockConsumerStartupTriageArgs } from './mock-consumer-startup-triage-cli-lib';
import {
  buildMockConsumerTriageMarkdown,
  buildMockConsumerUnblockMarkdown,
} from './mock-consumer-startup-triage-lib';

const main = (): number => {
  const options = parseMockConsumerStartupTriageArgs(process.argv.slice(2));
  const outputs = resolveConsumerStartupTriageOutputs(options.outDir);

  if (options.dryRun) {
    process.stdout.write('mock consumer startup triage dry-run plan:\n');
    process.stdout.write(`- block-summary: ${options.blockSummaryFile}\n`);
    process.stdout.write(`- minimal-summary: ${options.minimalSummaryFile}\n`);
    process.stdout.write(`- triage-report: ${outputs.triageReport}\n`);
    process.stdout.write(`- unblock-report: ${outputs.startupUnblockStatus}\n`);
    return 0;
  }

  const assessments: SmokeAssessment[] = [
    assessSmokeSummary('block', options.blockSummaryFile),
    assessSmokeSummary('minimal', options.minimalSummaryFile),
  ];

  const generatedAt = new Date().toISOString();
  const triage = buildMockConsumerTriageMarkdown({
    generatedAt,
    repo: options.repo,
    outDir: options.outDir,
    assessments,
  });
  const unblock = buildMockConsumerUnblockMarkdown({
    generatedAt,
    repo: options.repo,
    triageReportPath: outputs.triageReport,
    blockSummaryFile: options.blockSummaryFile,
    minimalSummaryFile: options.minimalSummaryFile,
    triageVerdict: triage.verdict,
  });

  const triagePath = resolve(process.cwd(), outputs.triageReport);
  const unblockPath = resolve(process.cwd(), outputs.startupUnblockStatus);
  mkdirSync(dirname(triagePath), { recursive: true });
  mkdirSync(dirname(unblockPath), { recursive: true });
  writeFileSync(triagePath, triage.markdown, 'utf8');
  writeFileSync(unblockPath, unblock.markdown, 'utf8');

  process.stdout.write(
    `mock consumer startup triage generated at ${triagePath} (verdict=${triage.verdict})\n`
  );
  process.stdout.write(
    `mock consumer startup unblock status generated at ${unblockPath} (verdict=${unblock.verdict})\n`
  );

  return triage.verdict === 'READY' ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`mock consumer startup triage failed: ${message}\n`);
  process.exit(1);
}
