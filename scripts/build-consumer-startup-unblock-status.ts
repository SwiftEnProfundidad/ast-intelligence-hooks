import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  parseConsumerStartupUnblockArgs,
  readConsumerStartupUnblockInput,
} from './consumer-startup-unblock-cli-lib';
import {
  parseAuthReport,
  parseSupportBundle,
} from './consumer-support-ticket-lib';
import {
  buildConsumerStartupUnblockStatus,
  parseWorkflowLintReport,
  summarizeConsumerStartupUnblock,
} from './consumer-startup-unblock-status-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parseConsumerStartupUnblockArgs(process.argv.slice(2));

  const supportBundle = readConsumerStartupUnblockInput(cwd, options.supportBundleFile);
  const authReport = readConsumerStartupUnblockInput(cwd, options.authReportFile);
  const workflowLintReport = readConsumerStartupUnblockInput(
    cwd,
    options.workflowLintReportFile
  );

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

  const outputPath = resolve(cwd, options.outFile);
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
