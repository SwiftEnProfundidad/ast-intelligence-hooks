import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  buildAdapterRealSessionReportMarkdown,
  parseAdapterRealSessionArgs,
  parseAdapterRealSessionStatusReport,
  tailFromContent,
} from './adapter-real-session-report-lib';

const runGit = (args: ReadonlyArray<string>): string => {
  try {
    return execFileSync('git', [...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
};

const readIfExists = (pathLike: string): string | undefined => {
  const absolute = resolve(process.cwd(), pathLike);
  if (!existsSync(absolute)) {
    return undefined;
  }

  return readFileSync(absolute, 'utf8');
};

const findLatestAuditFile = (params: {
  directory: string;
  prefix: string;
  suffix: string;
}): string | undefined => {
  const absoluteDirectory = resolve(process.cwd(), params.directory);
  if (!existsSync(absoluteDirectory)) {
    return undefined;
  }

  const matches = readdirSync(absoluteDirectory)
    .filter((entry) => entry.startsWith(params.prefix) && entry.endsWith(params.suffix))
    .sort((left, right) => right.localeCompare(left));

  if (matches.length === 0) {
    return undefined;
  }

  return join(params.directory, matches[0]);
};

const main = (): number => {
  const options = parseAdapterRealSessionArgs(process.argv.slice(2));

  const statusReport = readIfExists(options.statusReportFile);
  const parsedStatus = parseAdapterRealSessionStatusReport(statusReport);

  const hookConfigPath = '~/.codeium/adapter/hooks.json';
  const absoluteHookConfigPath = resolve(
    process.env.HOME ?? process.cwd(),
    '.codeium/adapter/hooks.json'
  );
  const hookConfigExists = existsSync(absoluteHookConfigPath);
  const hookConfigContent = hookConfigExists
    ? readFileSync(absoluteHookConfigPath, 'utf8')
    : undefined;

  const runtimeLogPath = findLatestAuditFile({
    directory: '.audit_tmp',
    prefix: 'cascade-hook-runtime-',
    suffix: '.log',
  });
  const smokeLogPath = findLatestAuditFile({
    directory: '.audit_tmp',
    prefix: 'cascade-hook-smoke-',
    suffix: '.log',
  });
  const hookLogPath = '.audit_tmp/cascade-hook.log';
  const writesLogPath = '.audit_tmp/cascade-writes.log';

  const runtimeLogContent = runtimeLogPath ? readIfExists(runtimeLogPath) : undefined;
  const smokeLogContent = smokeLogPath ? readIfExists(smokeLogPath) : undefined;
  const hookLogContent = readIfExists(hookLogPath);
  const writesLogContent = readIfExists(writesLogPath);

  const markdown = buildAdapterRealSessionReportMarkdown({
    options,
    nowIso: new Date().toISOString(),
    branch: runGit(['rev-parse', '--abbrev-ref', 'HEAD']),
    repository: runGit(['config', '--get', 'remote.origin.url']),
    nodeRuntime: process.version,
    hookConfigPath,
    hookConfigContent,
    statusReportPath: options.statusReportFile,
    statusReport,
    parsedStatus,
    runtimeLogPath,
    runtimeLogContent,
    runtimeLogTail: tailFromContent(runtimeLogContent, options.tailLines),
    smokeLogPath,
    smokeLogContent,
    smokeLogTail: tailFromContent(smokeLogContent, options.tailLines),
    hookLogPath,
    hookLogContent,
    hookLogTail: tailFromContent(hookLogContent, options.tailLines),
    writesLogPath,
    writesLogContent,
    writesLogTail: tailFromContent(writesLogContent, options.tailLines),
    hasRuntimeLog: Boolean(runtimeLogPath && runtimeLogContent),
    hasSmokeLog: Boolean(smokeLogPath && smokeLogContent),
    hasHookLog: Boolean(hookLogContent),
    hasWritesLog: Boolean(writesLogContent),
    hookConfigExists,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
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
