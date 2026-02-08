import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildAdapterReadinessMarkdown,
  parseAdapterReport,
  summarizeAdapterReadiness,
} from './adapter-readiness-lib';

type CliOptions = {
  adapterReportFile: string;
  outFile: string;
};

const DEFAULT_ADAPTER_REPORT_FILE = 'docs/validation/adapter-real-session-report.md';
const DEFAULT_OUT_FILE = 'docs/validation/adapter-readiness.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    adapterReportFile: DEFAULT_ADAPTER_REPORT_FILE,
    outFile: DEFAULT_OUT_FILE,
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

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
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

  const parsedAdapter = adapterReport.content
    ? parseAdapterReport(adapterReport.content)
    : undefined;

  const summary = summarizeAdapterReadiness({
    hasAdapterReport: adapterReport.exists,
    adapter: parsedAdapter,
  });

  const markdown = buildAdapterReadinessMarkdown({
    generatedAt: new Date().toISOString(),
    adapterReportPath: options.adapterReportFile,
    hasAdapterReport: adapterReport.exists,
    summary,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `adapter readiness report generated at ${outputPath} (verdict=${summary.verdict})\n`
  );

  return summary.verdict === 'READY' ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`adapter readiness generation failed: ${message}\n`);
  process.exit(1);
}
