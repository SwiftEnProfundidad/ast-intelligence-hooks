import { execFileSync as runBinarySync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type GitflowCommand = 'check' | 'status' | 'workflow' | 'reset';

type Writable = {
  write: (chunk: string) => void;
};

type GitflowCliIo = {
  out: Writable;
  err: Writable;
};

type GitflowSnapshot = {
  available: boolean;
  branch: string | null;
  upstream: string | null;
  ahead: number;
  behind: number;
  dirty: boolean;
  staged: number;
  unstaged: number;
};

const PROTECTED_BRANCHES = new Set(['main', 'develop', 'master', 'dev']);
const SUPPORTED_COMMANDS: ReadonlyArray<GitflowCommand> = ['check', 'status', 'workflow', 'reset'];

const isGitflowCommand = (value: string | undefined): value is GitflowCommand => {
  if (!value) {
    return false;
  }
  return SUPPORTED_COMMANDS.includes(value as GitflowCommand);
};

const safeRunGit = (repoRoot: string, args: ReadonlyArray<string>): string | undefined => {
  if (!existsSync(join(repoRoot, '.git'))) {
    return undefined;
  }
  try {
    return runBinarySync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
};

const toStatusLines = (statusShort: string): ReadonlyArray<string> => {
  return statusShort
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
};

const toCount = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
};

const parseAheadBehind = (value: string | undefined): { ahead: number; behind: number } => {
  if (!value) {
    return { ahead: 0, behind: 0 };
  }
  const parts = value.split(/\s+/).map((part) => Number.parseInt(part, 10));
  return {
    behind: toCount(parts[0]),
    ahead: toCount(parts[1]),
  };
};

const readGitflowSnapshot = (repoRoot: string): GitflowSnapshot => {
  if (!existsSync(join(repoRoot, '.git'))) {
    return {
      available: false,
      branch: null,
      upstream: null,
      ahead: 0,
      behind: 0,
      dirty: false,
      staged: 0,
      unstaged: 0,
    };
  }

  const branch = safeRunGit(repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const upstream = safeRunGit(repoRoot, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const statusShort = safeRunGit(repoRoot, ['status', '--short']) ?? '';
  const statusLines = toStatusLines(statusShort);
  const staged = statusLines.filter((line) => line[0] && line[0] !== '?' && line[0] !== ' ').length;
  const unstaged = statusLines.filter((line) => line[1] && line[1] !== ' ').length;
  const aheadBehindRaw = upstream
    ? safeRunGit(repoRoot, ['rev-list', '--left-right', '--count', `${upstream}...HEAD`])
    : undefined;
  const aheadBehind = parseAheadBehind(aheadBehindRaw);

  return {
    available: true,
    branch: branch ?? null,
    upstream: upstream ?? null,
    ahead: aheadBehind.ahead,
    behind: aheadBehind.behind,
    dirty: statusLines.length > 0,
    staged: toCount(staged),
    unstaged: toCount(unstaged),
  };
};

const writeLines = (target: Writable, lines: ReadonlyArray<string>): void => {
  target.write(`${lines.join('\n')}\n`);
};

const buildUsage = (): ReadonlyArray<string> => {
  return [
    'Usage: gitflow <check|status|workflow|reset>',
    'Commands:',
    '  check      Validate git-flow guardrails for current repository.',
    '  status     Print branch/upstream/worktree summary.',
    '  workflow   Print recommended next steps for current state.',
    '  reset      Non-destructive reset guidance (no git mutation).',
  ];
};

const formatSnapshot = (snapshot: GitflowSnapshot): ReadonlyArray<string> => {
  const worktree = snapshot.dirty ? 'dirty' : 'clean';
  return [
    `branch: ${snapshot.branch ?? '(unknown)'}`,
    `upstream: ${snapshot.upstream ?? '(none)'}`,
    `ahead: ${snapshot.ahead} behind: ${snapshot.behind}`,
    `worktree: ${worktree} (staged=${snapshot.staged}, unstaged=${snapshot.unstaged})`,
  ];
};

const runCheck = (snapshot: GitflowSnapshot): { exitCode: number; lines: ReadonlyArray<string> } => {
  if (!snapshot.available) {
    return {
      exitCode: 1,
      lines: [
        'GITFLOW CHECK',
        'status: BLOCK',
        'reason: current directory is not a git repository',
      ],
    };
  }
  const branch = snapshot.branch ?? '';
  if (PROTECTED_BRANCHES.has(branch)) {
    return {
      exitCode: 1,
      lines: [
        'GITFLOW CHECK',
        'status: BLOCK',
        `reason: rama protegida (${branch})`,
        ...formatSnapshot(snapshot),
      ],
    };
  }
  return {
    exitCode: 0,
    lines: ['GITFLOW CHECK', 'status: PASS', ...formatSnapshot(snapshot)],
  };
};

const runStatus = (snapshot: GitflowSnapshot): { exitCode: number; lines: ReadonlyArray<string> } => {
  if (!snapshot.available) {
    return {
      exitCode: 1,
      lines: ['GITFLOW STATUS', 'status: unavailable', 'reason: not a git repository'],
    };
  }
  return {
    exitCode: 0,
    lines: ['GITFLOW STATUS', ...formatSnapshot(snapshot)],
  };
};

const runWorkflow = (snapshot: GitflowSnapshot): { exitCode: number; lines: ReadonlyArray<string> } => {
  if (!snapshot.available) {
    return {
      exitCode: 1,
      lines: ['GITFLOW WORKFLOW', 'No git repository detected.'],
    };
  }

  const branch = snapshot.branch ?? '';
  const lines = ['GITFLOW WORKFLOW', ...formatSnapshot(snapshot), '', 'Next steps:'];

  if (PROTECTED_BRANCHES.has(branch)) {
    lines.push(`- rama protegida detectada (${branch})`);
    lines.push('- crea feature branch: git checkout -b feature/<ticket>');
  } else {
    lines.push('- rama de trabajo valida para desarrollo incremental.');
  }

  if (!snapshot.upstream) {
    lines.push('- configura upstream: git push --set-upstream origin <branch>');
  }

  if (snapshot.dirty) {
    lines.push('- worktree sucio: agrupa cambios y usa commits atomicos.');
  } else {
    lines.push('- worktree limpio: listo para siguiente iteracion.');
  }

  return {
    exitCode: 0,
    lines,
  };
};

const runReset = (): { exitCode: number; lines: ReadonlyArray<string> } => {
  return {
    exitCode: 0,
    lines: [
      'GITFLOW RESET',
      'mode: non-destructive',
      'No automatic git reset is performed.',
      'Use manual commands if you need to realign local state.',
    ],
  };
};

const runCommand = (
  command: GitflowCommand,
  snapshot: GitflowSnapshot
): { exitCode: number; lines: ReadonlyArray<string> } => {
  if (command === 'check') {
    return runCheck(snapshot);
  }
  if (command === 'status') {
    return runStatus(snapshot);
  }
  if (command === 'workflow') {
    return runWorkflow(snapshot);
  }
  return runReset();
};

export const runGitflowCli = (
  args: ReadonlyArray<string>,
  options?: {
    cwd?: string;
    io?: GitflowCliIo;
  }
): number => {
  const repoRoot = options?.cwd ?? process.cwd();
  const io = options?.io ?? { out: process.stdout, err: process.stderr };
  const commandInput = args[0];

  if (!isGitflowCommand(commandInput)) {
    writeLines(io.err, buildUsage());
    return 1;
  }

  const snapshot = readGitflowSnapshot(repoRoot);
  const outcome = runCommand(commandInput, snapshot);
  writeLines(io.out, outcome.lines);
  return outcome.exitCode;
};
