import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildPhase5BlockersReadinessMarkdown,
  parseConsumerStartupTriageReport,
  parseAdapterRealSessionReport,
  summarizePhase5Blockers,
} from './phase5-blockers-readiness-lib';

type CliOptions = {
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
  requireAdapterReport: boolean;
};

const DEFAULT_ADAPTER_REPORT_FILE = '.audit-reports/adapter/adapter-real-session-report.md';
const DEFAULT_CONSUMER_TRIAGE_FILE = '.audit-reports/consumer-triage/consumer-startup-triage-report.md';
const DEFAULT_OUT_FILE = '.audit-reports/phase5/phase5-blockers-readiness.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    adapterReportFile: DEFAULT_ADAPTER_REPORT_FILE,
    consumerTriageReportFile: DEFAULT_CONSUMER_TRIAGE_FILE,
    outFile: DEFAULT_OUT_FILE,
    requireAdapterReport: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--adapter-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --adapter-report');
      }
      options.adapterReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--consumer-triage-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --consumer-triage-report');
      }
      options.consumerTriageReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    if (arg === '--require-adapter-report') {
      options.requireAdapterReport = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const readMarkdownIfExists = (
  pathLike: string
): { exists: boolean; content?: string } => {
  const absolute = resolve(process.cwd(), pathLike);
  if (!existsSync(absolute)) {
    return { exists: false };
  }

  return {
    exists: true,
    content: readFileSync(absolute, 'utf8'),
  };
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));

  const adapterReport = readMarkdownIfExists(options.adapterReportFile);
  const consumerTriageReport = readMarkdownIfExists(options.consumerTriageReportFile);

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

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `phase5 blockers readiness report generated at ${outputPath} (verdict=${summary.verdict})\n`
  );

  return summary.verdict === 'READY' ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`phase5 blockers readiness generation failed: ${message}\n`);
  process.exit(1);
}
