import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  parseAuthReport,
  parseSupportBundle,
} from './consumer-support-ticket-lib';
import {
  buildConsumerStartupUnblockStatus,
  parseWorkflowLintReport,
  summarizeConsumerStartupUnblock,
} from './consumer-startup-unblock-status-lib';

type CliOptions = {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  workflowLintReportFile: string;
  outFile: string;
};

const DEFAULT_REPO = 'owner/repo';
const DEFAULT_SUPPORT_BUNDLE_FILE =
  '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md';
const DEFAULT_AUTH_REPORT_FILE = '.audit-reports/consumer-triage/consumer-ci-auth-check.md';
const DEFAULT_WORKFLOW_LINT_FILE = '.audit-reports/consumer-triage/consumer-workflow-lint-report.md';
const DEFAULT_OUT_FILE = '.audit-reports/consumer-triage/consumer-startup-unblock-status.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repo: DEFAULT_REPO,
    supportBundleFile: DEFAULT_SUPPORT_BUNDLE_FILE,
    authReportFile: DEFAULT_AUTH_REPORT_FILE,
    workflowLintReportFile: DEFAULT_WORKFLOW_LINT_FILE,
    outFile: DEFAULT_OUT_FILE,
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

    if (arg === '--support-bundle') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --support-bundle');
      }
      options.supportBundleFile = value;
      index += 1;
      continue;
    }

    if (arg === '--auth-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --auth-report');
      }
      options.authReportFile = value;
      index += 1;
      continue;
    }

    if (arg === '--workflow-lint-report') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --workflow-lint-report');
      }
      options.workflowLintReportFile = value;
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

  const supportBundle = readMarkdownIfExists(options.supportBundleFile);
  const authReport = readMarkdownIfExists(options.authReportFile);
  const workflowLintReport = readMarkdownIfExists(options.workflowLintReportFile);

  const parsedSupport = supportBundle.content
    ? parseSupportBundle(supportBundle.content)
    : undefined;
  const parsedAuth = authReport.content ? parseAuthReport(authReport.content) : undefined;
  const parsedWorkflowLint = workflowLintReport.content
    ? parseWorkflowLintReport(workflowLintReport.content)
    : undefined;

  const summary = summarizeConsumerStartupUnblock({
    hasSupportBundle: supportBundle.exists,
    hasAuthReport: authReport.exists,
    support: parsedSupport,
    auth: parsedAuth,
    workflowLint: parsedWorkflowLint,
  });

  const markdown = buildConsumerStartupUnblockStatus({
    repo: options.repo,
    supportBundlePath: options.supportBundleFile,
    authReportPath: options.authReportFile,
    workflowLintReportPath: options.workflowLintReportFile,
    hasSupportBundle: supportBundle.exists,
    hasAuthReport: authReport.exists,
    hasWorkflowLintReport: workflowLintReport.exists,
    summary,
    support: parsedSupport,
    auth: parsedAuth,
    workflowLint: parsedWorkflowLint,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `consumer startup unblock status generated at ${outputPath} (verdict=${summary.verdict})\n`
  );
  return 0;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`consumer startup unblock status failed: ${message}\n`);
  process.exit(1);
}
