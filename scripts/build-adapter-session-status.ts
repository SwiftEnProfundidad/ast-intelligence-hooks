import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  determineAdapterSessionVerdict,
  type AdapterSessionVerdict,
} from './adapter-session-status-lib';

type CliOptions = {
  outFile: string;
  tailLines: number;
};

type CommandExecution = {
  label: string;
  command: string;
  exitCode: number;
  output: string;
};

const DEFAULT_OUT_FILE = 'docs/validation/adapter-session-status.md';
const DEFAULT_TAIL_LINES = 80;

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    outFile: DEFAULT_OUT_FILE,
    tailLines: DEFAULT_TAIL_LINES,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    if (arg === '--tail-lines') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --tail-lines');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --tail-lines value: ${value}`);
      }
      options.tailLines = parsed;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
};

const runCommand = (label: string, command: string): CommandExecution => {
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

const readTail = (filePath: string, lines: number): string => {
  if (!existsSync(filePath)) {
    return `[missing] ${filePath}`;
  }

  const content = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const tail = content.slice(Math.max(content.length - lines, 0));
  return tail.join('\n').trimEnd();
};

const isPathInsideRepo = (params: { repoRoot: string; filePath: string }): boolean => {
  const candidate = params.filePath.trim();
  if (candidate.length === 0) {
    return false;
  }

  if (!candidate.startsWith('/')) {
    return true;
  }

  const normalizedRepo = params.repoRoot.endsWith('/')
    ? params.repoRoot
    : `${params.repoRoot}/`;
  return candidate === params.repoRoot || candidate.startsWith(normalizedRepo);
};

const readTailForHookLog = (params: {
  filePath: string;
  lines: number;
  repoRoot: string;
}): string => {
  if (!existsSync(params.filePath)) {
    return `[missing] ${params.filePath}`;
  }

  const allLines = readFileSync(params.filePath, 'utf8').split(/\r?\n/);
  const extractHookFilePath = (line: string): string | undefined => {
    const analyzingMatch = line.match(/^\\[[^\\]]+\\]\\s+ANALYZING:\\s+(.+?)\\s+\\(\\d+\\s+edits\\)/);
    if (analyzingMatch && analyzingMatch[1]) {
      return analyzingMatch[1];
    }

    const decisionMatch = line.match(/^\\[[^\\]]+\\]\\s+(?:BLOCKED|ALLOWED):.+\\s+in\\s+(.+)$/);
    if (decisionMatch && decisionMatch[1]) {
      return decisionMatch[1];
    }

    return undefined;
  };

  const filtered = allLines.filter((line) => {
    if (line.trim().length === 0) {
      return false;
    }

    const filePath = extractHookFilePath(line);
    if (filePath && isPathInsideRepo({ repoRoot: params.repoRoot, filePath })) {
      return true;
    }

    return (
      line.includes('__pumuki_simulated__') ||
      line.includes('apps/backend/src/example.ts')
    );
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

  const allLines = readFileSync(params.filePath, 'utf8').split(/\r?\n/);
  const filtered: string[] = [];

  for (const line of allLines) {
    if (line.trim().length === 0) {
      continue;
    }

    try {
      const parsed = JSON.parse(line) as { file?: string };
      const filePath = typeof parsed.file === 'string' ? parsed.file : '';
      if (isPathInsideRepo({ repoRoot: params.repoRoot, filePath })) {
        filtered.push(line);
      }
    } catch {
      // Ignore malformed lines to keep the report deterministic.
    }
  }

  if (filtered.length === 0) {
    return `[no entries matched repoRoot=${params.repoRoot}]`;
  }

  return filtered.slice(Math.max(filtered.length - params.lines, 0)).join('\n').trimEnd();
};

const markdownEscapeFence = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

const buildMarkdown = (params: {
  options: CliOptions;
  commands: ReadonlyArray<CommandExecution>;
  verdict: AdapterSessionVerdict;
  tails: ReadonlyArray<{ title: string; path: string; content: string }>;
}): string => {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push('# Adapter Session Status Report');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- verdict: ${params.verdict}`);
  lines.push(`- tail_lines: ${params.options.tailLines}`);
  lines.push('');

  lines.push('## Commands');
  lines.push('');
  lines.push('| step | command | exit_code |');
  lines.push('| --- | --- | --- |');
  for (const command of params.commands) {
    lines.push(`| ${command.label} | \`${command.command}\` | ${command.exitCode} |`);
  }
  lines.push('');

  lines.push('## Command Output');
  lines.push('');
  for (const command of params.commands) {
    lines.push(`### ${command.label}`);
    lines.push('');
    lines.push('```text');
    lines.push(markdownEscapeFence(command.output.trimEnd()));
    lines.push('```');
    lines.push('');
  }

  lines.push('## Audit Log Tails');
  lines.push('');
  for (const tail of params.tails) {
    lines.push(`### ${tail.title}`);
    lines.push('');
    lines.push(`- path: \`${tail.path}\``);
    lines.push('```text');
    lines.push(markdownEscapeFence(tail.content));
    lines.push('```');
    lines.push('');
  }

  lines.push('## Interpretation');
  lines.push('');
  if (params.verdict === 'PASS') {
    lines.push('- Real Adapter pre/post events are present in strict session assessment.');
  } else if (params.verdict === 'NEEDS_REAL_SESSION') {
    lines.push('- Runtime wiring appears healthy, but strict assessment did not observe real IDE events yet.');
    lines.push('- Next: execute a real Adapter write session and regenerate this report.');
  } else {
    lines.push('- Runtime verification and/or session assessments are failing.');
    lines.push('- Next: run `npm run install:adapter-hooks-config` and `npm run verify:adapter-hooks-runtime`, then retry.');
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));

  const commands: CommandExecution[] = [
    runCommand(
      'collect-runtime-diagnostics',
      'bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh'
    ),
    runCommand('verify-adapter-hooks-runtime', 'npm run verify:adapter-hooks-runtime'),
    runCommand('assess-adapter-hooks-session', 'npm run assess:adapter-hooks-session'),
    runCommand('assess-adapter-hooks-session:any', 'npm run assess:adapter-hooks-session:any'),
  ];

  const verifyResult = commands.find(
    (item) => item.label === 'verify-adapter-hooks-runtime'
  );
  const strictResult = commands.find(
    (item) => item.label === 'assess-adapter-hooks-session'
  );
  const anyResult = commands.find(
    (item) => item.label === 'assess-adapter-hooks-session:any'
  );

  if (!verifyResult || !strictResult || !anyResult) {
    throw new Error('Missing required command execution results.');
  }

  const verdict = determineAdapterSessionVerdict({
    verifyExitCode: verifyResult.exitCode,
    strictOutput: strictResult.output,
    anyOutput: anyResult.output,
  });

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

  const tails = [
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
      content: readTail(latestRuntime, options.tailLines),
    },
    {
      title: basename(latestSmoke),
      path: latestSmoke,
      content: readTail(latestSmoke, options.tailLines),
    },
  ] as const;

  const markdown = buildMarkdown({
    options,
    commands,
    verdict,
    tails,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `adapter session status report generated at ${outputPath} (verdict=${verdict})\n`
  );

  if (verdict === 'PASS') {
    return 0;
  }

  if (verdict === 'NEEDS_REAL_SESSION') {
    return 2;
  }

  return 1;
};

process.exitCode = main();
