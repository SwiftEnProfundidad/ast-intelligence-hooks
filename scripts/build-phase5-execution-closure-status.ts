import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildPhase5ExecutionClosureStatusMarkdown,
  parseVerdictFromMarkdown,
  summarizePhase5ExecutionClosure,
} from './phase5-execution-closure-status-lib';
import {
  parsePhase5ExecutionClosureStatusArgs,
  readPhase5ExecutionClosureStatusInput,
} from './phase5-execution-closure-status-cli-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parsePhase5ExecutionClosureStatusArgs(process.argv.slice(2));

  const phase5BlockersReport = readPhase5ExecutionClosureStatusInput(
    cwd,
    options.phase5BlockersReportFile
  );
  const consumerUnblockReport = readPhase5ExecutionClosureStatusInput(
    cwd,
    options.consumerUnblockReportFile
  );
  const adapterReadinessReport = readPhase5ExecutionClosureStatusInput(
    cwd,
    options.adapterReadinessReportFile
  );

  const summary = summarizePhase5ExecutionClosure({
    hasPhase5BlockersReport: phase5BlockersReport.exists,
    hasConsumerUnblockReport: consumerUnblockReport.exists,
    hasAdapterReadinessReport: adapterReadinessReport.exists,
    phase5BlockersVerdict: phase5BlockersReport.content
      ? parseVerdictFromMarkdown(phase5BlockersReport.content)
      : undefined,
    consumerUnblockVerdict: consumerUnblockReport.content
      ? parseVerdictFromMarkdown(consumerUnblockReport.content)
      : undefined,
    adapterReadinessVerdict: adapterReadinessReport.content
      ? parseVerdictFromMarkdown(adapterReadinessReport.content)
      : undefined,
    requireAdapterReadiness: options.requireAdapterReadiness,
  });

  const markdown = buildPhase5ExecutionClosureStatusMarkdown({
    generatedAt: new Date().toISOString(),
    phase5BlockersReportPath: options.phase5BlockersReportFile,
    consumerUnblockReportPath: options.consumerUnblockReportFile,
    adapterReadinessReportPath: options.adapterReadinessReportFile,
    hasPhase5BlockersReport: phase5BlockersReport.exists,
    hasConsumerUnblockReport: consumerUnblockReport.exists,
    hasAdapterReadinessReport: adapterReadinessReport.exists,
    summary,
  });

  const outputPath = resolve(cwd, options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `phase5 execution closure status generated at ${outputPath} (verdict=${summary.verdict})\n`
  );

  return summary.verdict === 'READY' ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`phase5 execution closure status failed: ${message}\n`);
  process.exit(1);
}
