import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildPhase5BlockersReadinessMarkdown,
  parseConsumerStartupTriageReport,
  parseAdapterRealSessionReport,
  summarizePhase5Blockers,
} from './phase5-blockers-readiness-lib';
import {
  parsePhase5BlockersReadinessArgs,
  readPhase5BlockersReadinessInput,
} from './phase5-blockers-readiness-cli-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parsePhase5BlockersReadinessArgs(process.argv.slice(2));

  const adapterReport = readPhase5BlockersReadinessInput(
    cwd,
    options.adapterReportFile
  );
  const consumerTriageReport = readPhase5BlockersReadinessInput(
    cwd,
    options.consumerTriageReportFile
  );

  const parsedAdapter = adapterReport.content
    ? parseAdapterRealSessionReport(adapterReport.content)
    : undefined;
  const parsedConsumer = consumerTriageReport.content
    ? parseConsumerStartupTriageReport(consumerTriageReport.content)
    : undefined;

  const summary = summarizePhase5Blockers({
    hasAdapterReport: adapterReport.exists,
    hasConsumerTriageReport: consumerTriageReport.exists,
    adapter: parsedAdapter,
    consumer: parsedConsumer,
    requireAdapterReport: options.requireAdapterReport,
  });

  const markdown = buildPhase5BlockersReadinessMarkdown({
    generatedAt: new Date().toISOString(),
    adapterReportPath: options.adapterReportFile,
    consumerTriageReportPath: options.consumerTriageReportFile,
    hasAdapterReport: adapterReport.exists,
    hasConsumerTriageReport: consumerTriageReport.exists,
    requireAdapterReport: options.requireAdapterReport,
    summary,
  });

  const outputPath = resolve(cwd, options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `phase5 blockers readiness report generated at ${outputPath} (verdict=${summary.verdict})\n`
  );

  return summary.verdict === 'READY' ? 0 : 1;
};

try {
  process.exitCode = main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`phase5 blockers readiness generation failed: ${message}\n`);
  process.exitCode = 1;
}
