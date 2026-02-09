import {
  determineAdapterSessionVerdict,
  type AdapterSessionVerdict,
} from './adapter-session-status-lib';

export type AdapterSessionStatusCliOptions = {
  outFile: string;
  tailLines: number;
};

export type AdapterSessionStatusCommand = {
  label: string;
  command: string;
};

export type AdapterSessionStatusCommandExecution = {
  label: string;
  command: string;
  exitCode: number;
  output: string;
};

export type AdapterSessionStatusTail = {
  title: string;
  path: string;
  content: string;
};

export const DEFAULT_ADAPTER_SESSION_STATUS_OUT_FILE =
  '.audit-reports/adapter/adapter-session-status.md';
export const DEFAULT_ADAPTER_SESSION_STATUS_TAIL_LINES = 80;

export const ADAPTER_SESSION_STATUS_COMMANDS: ReadonlyArray<AdapterSessionStatusCommand> = [
  {
    label: 'collect-runtime-diagnostics',
    command:
      'bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh',
  },
  {
    label: 'verify-adapter-hooks-runtime',
    command: 'npm run verify:adapter-hooks-runtime',
  },
  {
    label: 'assess-adapter-hooks-session',
    command: 'npm run assess:adapter-hooks-session',
  },
  {
    label: 'assess-adapter-hooks-session:any',
    command: 'npm run assess:adapter-hooks-session:any',
  },
];

export const parseAdapterSessionStatusArgs = (
  args: ReadonlyArray<string>
): AdapterSessionStatusCliOptions => {
  const options: AdapterSessionStatusCliOptions = {
    outFile: DEFAULT_ADAPTER_SESSION_STATUS_OUT_FILE,
    tailLines: DEFAULT_ADAPTER_SESSION_STATUS_TAIL_LINES,
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

export const toTailFromText = (text: string, lines: number): string => {
  const rows = text.split(/\r?\n/);
  return rows.slice(Math.max(rows.length - lines, 0)).join('\n').trimEnd();
};

export const isPathInsideRepo = (params: {
  repoRoot: string;
  filePath: string;
}): boolean => {
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

export const filterHookLogLinesForRepo = (params: {
  content: string;
  repoRoot: string;
}): ReadonlyArray<string> => {
  const allLines = params.content.split(/\r?\n/);
  const extractHookFilePath = (line: string): string | undefined => {
    const analyzingMatch = line.match(
      /^\\[[^\\]]+\\]\\s+ANALYZING:\\s+(.+?)\\s+\\(\\d+\\s+edits\\)/
    );
    if (analyzingMatch?.[1]) {
      return analyzingMatch[1];
    }

    const decisionMatch = line.match(/^\\[[^\\]]+\\]\\s+(?:BLOCKED|ALLOWED):.+\\s+in\\s+(.+)$/);
    if (decisionMatch?.[1]) {
      return decisionMatch[1];
    }

    return undefined;
  };

  return allLines.filter((line) => {
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
};

export const filterWritesLogLinesForRepo = (params: {
  content: string;
  repoRoot: string;
}): ReadonlyArray<string> => {
  const allLines = params.content.split(/\r?\n/);
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
    } catch {}
  }

  return filtered;
};

export const deriveAdapterSessionVerdictFromCommands = (
  commands: ReadonlyArray<AdapterSessionStatusCommandExecution>
): AdapterSessionVerdict => {
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

  return determineAdapterSessionVerdict({
    verifyExitCode: verifyResult.exitCode,
    strictOutput: strictResult.output,
    anyOutput: anyResult.output,
  });
};

const markdownEscapeFence = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

export const buildAdapterSessionStatusMarkdown = (params: {
  generatedAtIso: string;
  options: AdapterSessionStatusCliOptions;
  commands: ReadonlyArray<AdapterSessionStatusCommandExecution>;
  verdict: AdapterSessionVerdict;
  tails: ReadonlyArray<AdapterSessionStatusTail>;
}): string => {
  const lines: string[] = [];

  lines.push('# Adapter Session Status Report');
  lines.push('');
  lines.push(`- generated_at: ${params.generatedAtIso}`);
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

export const exitCodeForAdapterSessionVerdict = (
  verdict: AdapterSessionVerdict
): number => {
  if (verdict === 'PASS') {
    return 0;
  }

  if (verdict === 'NEEDS_REAL_SESSION') {
    return 2;
  }

  return 1;
};
