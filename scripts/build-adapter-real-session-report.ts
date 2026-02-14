import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  loadAdapterAuditSnapshot,
  loadAdapterHookConfigSnapshot,
  readFileIfExists,
  runGitOrUnknown,
} from './adapter-real-session-context-lib';
import {
  buildAdapterRealSessionReportMarkdown,
  parseAdapterRealSessionArgs,
  parseAdapterRealSessionStatusReport,
} from './adapter-real-session-report-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parseAdapterRealSessionArgs(process.argv.slice(2));
  const statusReport = readFileIfExists(cwd, options.statusReportFile);
  const parsedStatus = parseAdapterRealSessionStatusReport(statusReport);
  const hookConfigSnapshot = loadAdapterHookConfigSnapshot({
    cwd,
    homeDir: process.env.HOME,
  });
  const auditSnapshot = loadAdapterAuditSnapshot({
    cwd,
    tailLines: options.tailLines,
  });

  const markdown = buildAdapterRealSessionReportMarkdown({
    options,
    nowIso: new Date().toISOString(),
    branch: runGitOrUnknown(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']),
    repository: runGitOrUnknown(cwd, ['config', '--get', 'remote.origin.url']),
    nodeRuntime: process.version,
    hookConfigPath: hookConfigSnapshot.hookConfigPath,
    hookConfigContent: hookConfigSnapshot.hookConfigContent,
    statusReportPath: options.statusReportFile,
    statusReport,
    parsedStatus,
    ...auditSnapshot,
    hookConfigExists: hookConfigSnapshot.hookConfigExists,
  });

  const outputPath = resolve(cwd, options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(`adapter real-session report generated at ${outputPath}\n`);
  return 0;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`adapter real-session report generation failed: ${message}\n`);
  process.exit(1);
}
