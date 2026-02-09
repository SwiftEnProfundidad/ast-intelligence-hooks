import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseVerdictFromMarkdown } from './phase5-execution-closure-status-lib';
import {
  buildPhase5ExternalHandoffMarkdown,
  summarizePhase5ExternalHandoff,
} from './phase5-external-handoff-lib';

type CliOptions = {
  repo: string;
  phase5StatusReportFile: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  mockAbReportFile: string;
  runReportFile: string;
  outFile: string;
  artifactUrls: string[];
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
};

const DEFAULT_REPO = 'owner/repo';
const DEFAULT_PHASE5_STATUS_REPORT_FILE =
  '.audit-reports/phase5/phase5-execution-closure-status.md';
const DEFAULT_PHASE5_BLOCKERS_REPORT_FILE =
  '.audit-reports/phase5/phase5-blockers-readiness.md';
const DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE =
  '.audit-reports/phase5/consumer-startup-unblock-status.md';
const DEFAULT_MOCK_AB_REPORT_FILE = '.audit-reports/phase5/mock-consumer-ab-report.md';
const DEFAULT_RUN_REPORT_FILE = '.audit-reports/phase5/phase5-execution-closure-run-report.md';
const DEFAULT_OUT_FILE = '.audit-reports/phase5/phase5-external-handoff.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repo: DEFAULT_REPO,
    phase5StatusReportFile: DEFAULT_PHASE5_STATUS_REPORT_FILE,
    phase5BlockersReportFile: DEFAULT_PHASE5_BLOCKERS_REPORT_FILE,
    consumerUnblockReportFile: DEFAULT_CONSUMER_UNBLOCK_REPORT_FILE,
    mockAbReportFile: DEFAULT_MOCK_AB_REPORT_FILE,
    runReportFile: DEFAULT_RUN_REPORT_FILE,
    outFile: DEFAULT_OUT_FILE,
    artifactUrls: [],
    requireArtifactUrls: false,
    requireMockAbReport: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }
    if (arg === '--phase5-status-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --phase5-status-report');
      }
      options.phase5StatusReportFile = value;
      index += 1;
      continue;
    }
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
    if (arg === '--mock-ab-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --mock-ab-report');
      }
      options.mockAbReportFile = value;
      index += 1;
      continue;
    }
    if (arg === '--run-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --run-report');
      }
      options.runReportFile = value;
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
    if (arg === '--artifact-url') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --artifact-url');
      }
      options.artifactUrls.push(value);
      index += 1;
      continue;
    }
    if (arg === '--require-artifact-urls') {
      options.requireArtifactUrls = true;
      continue;
    }
    if (arg === '--require-mock-ab-report') {
      options.requireMockAbReport = true;
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

  const phase5StatusReport = readMarkdownIfExists(options.phase5StatusReportFile);
  const phase5BlockersReport = readMarkdownIfExists(options.phase5BlockersReportFile);
  const consumerUnblockReport = readMarkdownIfExists(options.consumerUnblockReportFile);
  const mockAbReport = readMarkdownIfExists(options.mockAbReportFile);
  const runReport = readMarkdownIfExists(options.runReportFile);

  const summary = summarizePhase5ExternalHandoff({
    hasPhase5StatusReport: phase5StatusReport.exists,
    hasPhase5BlockersReport: phase5BlockersReport.exists,
    hasConsumerUnblockReport: consumerUnblockReport.exists,
    hasMockAbReport: mockAbReport.exists,
    hasRunReport: runReport.exists,
    phase5StatusVerdict: phase5StatusReport.content
      ? parseVerdictFromMarkdown(phase5StatusReport.content)
      : undefined,
    phase5BlockersVerdict: phase5BlockersReport.content
      ? parseVerdictFromMarkdown(phase5BlockersReport.content)
      : undefined,
    consumerUnblockVerdict: consumerUnblockReport.content
      ? parseVerdictFromMarkdown(consumerUnblockReport.content)
      : undefined,
    mockAbVerdict: mockAbReport.content
      ? parseVerdictFromMarkdown(mockAbReport.content)
      : undefined,
    runReportVerdict: runReport.content
      ? parseVerdictFromMarkdown(runReport.content)
      : undefined,
    artifactUrls: options.artifactUrls,
    requireArtifactUrls: options.requireArtifactUrls,
    requireMockAbReport: options.requireMockAbReport,
  });

  const markdown = buildPhase5ExternalHandoffMarkdown({
    generatedAt: new Date().toISOString(),
    repo: options.repo,
    phase5StatusReportPath: options.phase5StatusReportFile,
    phase5BlockersReportPath: options.phase5BlockersReportFile,
    consumerUnblockReportPath: options.consumerUnblockReportFile,
    mockAbReportPath: options.mockAbReportFile,
    runReportPath: options.runReportFile,
    hasPhase5StatusReport: phase5StatusReport.exists,
    hasPhase5BlockersReport: phase5BlockersReport.exists,
    hasConsumerUnblockReport: consumerUnblockReport.exists,
    hasMockAbReport: mockAbReport.exists,
    hasRunReport: runReport.exists,
    summary,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `phase5 external handoff report generated at ${outputPath} (verdict=${summary.verdict})\n`
  );

  return summary.verdict === 'READY' ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`phase5 external handoff failed: ${message}\n`);
  process.exit(1);
}
