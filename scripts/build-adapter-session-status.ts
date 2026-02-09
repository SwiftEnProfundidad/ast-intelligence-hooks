import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  ADAPTER_SESSION_STATUS_COMMANDS,
  buildAdapterSessionStatusMarkdown,
  deriveAdapterSessionVerdictFromCommands,
  exitCodeForAdapterSessionVerdict,
  filterHookLogLinesForRepo,
  filterWritesLogLinesForRepo,
  parseAdapterSessionStatusArgs,
  toTailFromText,
  type AdapterSessionStatusCommandExecution,
} from './adapter-session-status-report-lib';

const runCommand = (
  label: string,
  command: string
): AdapterSessionStatusCommandExecution => {
  try {
    const output = execFileSync('bash', ['-lc', command], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return {
      label,
      command,
      exitCode: 0,
      output,
    };
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      'stdout' in error &&
      'stderr' in error
    ) {
      const status = Number((error as { status?: number }).status ?? 1);
      const stdout = String((error as { stdout?: string | Buffer }).stdout ?? '');
      const stderr = String((error as { stderr?: string | Buffer }).stderr ?? '');

      return {
        label,
        command,
        exitCode: Number.isFinite(status) ? status : 1,
        output: `${stdout}${stderr}`.trim(),
      };
    }

    throw error;
  }
};

const findLatestAuditFile = (params: {
  directory: string;
  prefix: string;
  suffix: string;
}): string | undefined => {
  if (!existsSync(params.directory)) {
    return undefined;
  }

  const matches = readdirSync(params.directory)
    .filter((entry) => entry.startsWith(params.prefix) && entry.endsWith(params.suffix))
    .sort((left, right) => right.localeCompare(left));

  if (matches.length === 0) {
    return undefined;
  }

  return join(params.directory, matches[0]);
};

const readTailFile = (filePath: string, lines: number): string => {
  if (!existsSync(filePath)) {
    return `[missing] ${filePath}`;
  }

  return toTailFromText(readFileSync(filePath, 'utf8'), lines);
};

const readTailForHookLog = (params: {
  filePath: string;
  lines: number;
  repoRoot: string;
}): string => {
  if (!existsSync(params.filePath)) {
    return `[missing] ${params.filePath}`;
  }

  const filtered = filterHookLogLinesForRepo({
    content: readFileSync(params.filePath, 'utf8'),
    repoRoot: params.repoRoot,
  });

  if (filtered.length === 0) {
    return `[no entries matched repoRoot=${params.repoRoot}]`;
  }

  return filtered.slice(Math.max(filtered.length - params.lines, 0)).join('\n').trimEnd();
};

const readTailForWritesLog = (params: {
  filePath: string;
  lines: number;
  repoRoot: string;
}): string => {
  if (!existsSync(params.filePath)) {
    return `[missing] ${params.filePath}`;
  }

  const filtered = filterWritesLogLinesForRepo({
    content: readFileSync(params.filePath, 'utf8'),
    repoRoot: params.repoRoot,
  });

  if (filtered.length === 0) {
    return `[no entries matched repoRoot=${params.repoRoot}]`;
  }

  return filtered.slice(Math.max(filtered.length - params.lines, 0)).join('\n').trimEnd();
};

const main = (): number => {
  const options = parseAdapterSessionStatusArgs(process.argv.slice(2));

  const commands = ADAPTER_SESSION_STATUS_COMMANDS.map((command) =>
    runCommand(command.label, command.command)
  );
  const verdict = deriveAdapterSessionVerdictFromCommands(commands);

  const repoRoot = resolve(process.cwd());
  const auditDir = resolve(repoRoot, '.audit_tmp');
  const latestRuntime =
    findLatestAuditFile({
      directory: auditDir,
      prefix: 'cascade-hook-runtime-',
      suffix: '.log',
    }) ?? join(auditDir, 'cascade-hook-runtime-<missing>.log');
  const latestSmoke =
    findLatestAuditFile({
      directory: auditDir,
      prefix: 'cascade-hook-smoke-',
      suffix: '.log',
    }) ?? join(auditDir, 'cascade-hook-smoke-<missing>.log');

  const markdown = buildAdapterSessionStatusMarkdown({
    generatedAtIso: new Date().toISOString(),
    options,
    commands,
    verdict,
    tails: [
      {
        title: 'cascade-hook.log',
        path: resolve(repoRoot, '.audit_tmp/cascade-hook.log'),
        content: readTailForHookLog({
          filePath: resolve(repoRoot, '.audit_tmp/cascade-hook.log'),
          lines: options.tailLines,
          repoRoot,
        }),
      },
      {
        title: 'cascade-writes.log',
        path: resolve(repoRoot, '.audit_tmp/cascade-writes.log'),
        content: readTailForWritesLog({
          filePath: resolve(repoRoot, '.audit_tmp/cascade-writes.log'),
          lines: options.tailLines,
          repoRoot,
        }),
      },
      {
        title: basename(latestRuntime),
        path: latestRuntime,
        content: readTailFile(latestRuntime, options.tailLines),
      },
      {
        title: basename(latestSmoke),
        path: latestSmoke,
        content: readTailFile(latestSmoke, options.tailLines),
      },
    ],
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `adapter session status report generated at ${outputPath} (verdict=${verdict})\n`
  );

  return exitCodeForAdapterSessionVerdict(verdict);
};

process.exitCode = main();
