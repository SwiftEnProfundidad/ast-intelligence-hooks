import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildPhase5BlockersReadinessMarkdown,
  parseConsumerStartupTriageReport,
  parseWindsurfRealSessionReport,
  summarizePhase5Blockers,
} from './phase5-blockers-readiness-lib';

type CliOptions = {
  windsurfReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
  requireWindsurfReport: boolean;
};

const DEFAULT_WINDSURF_REPORT_FILE = 'docs/validation/windsurf-real-session-report.md';
const DEFAULT_CONSUMER_TRIAGE_FILE = 'docs/validation/consumer-startup-triage-report.md';
const DEFAULT_OUT_FILE = 'docs/validation/phase5-blockers-readiness.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    windsurfReportFile: DEFAULT_WINDSURF_REPORT_FILE,
    consumerTriageReportFile: DEFAULT_CONSUMER_TRIAGE_FILE,
    outFile: DEFAULT_OUT_FILE,
    requireWindsurfReport: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--windsurf-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --windsurf-report');
      }
      options.windsurfReportFile = value;
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

    if (arg === '--require-windsurf-report') {
      options.requireWindsurfReport = true;
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

  const windsurfReport = readMarkdownIfExists(options.windsurfReportFile);
  const consumerTriageReport = readMarkdownIfExists(options.consumerTriageReportFile);

  const parsedWindsurf = windsurfReport.content
    ? parseWindsurfRealSessionReport(windsurfReport.content)
    : undefined;
  const parsedConsumer = consumerTriageReport.content
    ? parseConsumerStartupTriageReport(consumerTriageReport.content)
    : undefined;

  const summary = summarizePhase5Blockers({
    hasWindsurfReport: windsurfReport.exists,
    hasConsumerTriageReport: consumerTriageReport.exists,
    windsurf: parsedWindsurf,
    consumer: parsedConsumer,
    requireWindsurfReport: options.requireWindsurfReport,
  });

  const markdown = buildPhase5BlockersReadinessMarkdown({
    generatedAt: new Date().toISOString(),
    windsurfReportPath: options.windsurfReportFile,
    consumerTriageReportPath: options.consumerTriageReportFile,
    hasWindsurfReport: windsurfReport.exists,
    hasConsumerTriageReport: consumerTriageReport.exists,
    requireWindsurfReport: options.requireWindsurfReport,
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
