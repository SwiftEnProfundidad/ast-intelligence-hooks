import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildPhase5ExecutionClosureStatusMarkdown,
  parseVerdictFromMarkdown,
  summarizePhase5ExecutionClosure,
} from './phase5-execution-closure-status-lib';

type CliOptions = {
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
};

const DEFAULT_PHASE5_BLOCKERS_REPORT_FILE =
  '.audit-reports/phase5/phase5-blockers-readiness.md';
const DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE =
  '.audit-reports/consumer-triage/consumer-startup-unblock-status.md';
const DEFAULT_ADAPTER_READINESS_REPORT_FILE = '.audit-reports/adapter/adapter-readiness.md';
const DEFAULT_OUT_FILE = '.audit-reports/phase5/phase5-execution-closure-status.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    phase5BlockersReportFile: DEFAULT_PHASE5_BLOCKERS_REPORT_FILE,
    consumerUnblockReportFile: DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE,
    adapterReadinessReportFile: DEFAULT_ADAPTER_READINESS_REPORT_FILE,
    outFile: DEFAULT_OUT_FILE,
    requireAdapterReadiness: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--phase5-blockers-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --phase5-blockers-report');
      }
      options.phase5BlockersReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--consumer-unblock-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --consumer-unblock-report');
      }
      options.consumerUnblockReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--adapter-readiness-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --adapter-readiness-report');
      }
      options.adapterReadinessReportFile = value;
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

    if (arg === '--require-adapter-readiness') {
      options.requireAdapterReadiness = true;
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

  const phase5BlockersReport = readMarkdownIfExists(options.phase5BlockersReportFile);
  const consumerUnblockReport = readMarkdownIfExists(options.consumerUnblockReportFile);
  const adapterReadinessReport = readMarkdownIfExists(options.adapterReadinessReportFile);

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

  const outputPath = resolve(process.cwd(), options.outFile);
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
