import type {
  GitflowCommand,
  GitflowCommandOutcome,
  GitflowSnapshot,
  Writable,
} from './gitflow-cli-types';

const PROTECTED_BRANCHES = new Set(['main', 'develop', 'master', 'dev']);
export const SUPPORTED_GITFLOW_COMMANDS: ReadonlyArray<GitflowCommand> = ['check', 'status', 'workflow', 'reset'];

export const isGitflowCommand = (value: string | undefined): value is GitflowCommand => {
  if (!value) {
    return false;
  }
  return SUPPORTED_GITFLOW_COMMANDS.includes(value as GitflowCommand);
};

export const writeGitflowLines = (target: Writable, lines: ReadonlyArray<string>): void => {
  target.write(`${lines.join('\n')}\n`);
};

export const buildGitflowUsage = (): ReadonlyArray<string> => {
  return [
    'Usage: gitflow <check|status|workflow|reset>',
    'Commands:',
    '  check      Validate git-flow guardrails for current repository.',
    '  status     Print branch/upstream/worktree summary.',
    '  workflow   Print recommended next steps for current state.',
    '  reset      Non-destructive reset guidance (no git mutation).',
  ];
};

export const formatGitflowSnapshot = (snapshot: GitflowSnapshot): ReadonlyArray<string> => {
  const worktree = snapshot.dirty ? 'dirty' : 'clean';
  return [
    `branch: ${snapshot.branch ?? '(unknown)'}`,
    `upstream: ${snapshot.upstream ?? '(none)'}`,
    `ahead: ${snapshot.ahead} behind: ${snapshot.behind}`,
    `worktree: ${worktree} (staged=${snapshot.staged}, unstaged=${snapshot.unstaged})`,
  ];
};

const runCheck = (snapshot: GitflowSnapshot): GitflowCommandOutcome => {
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
        ...formatGitflowSnapshot(snapshot),
      ],
    };
  }
  return {
    exitCode: 0,
    lines: ['GITFLOW CHECK', 'status: PASS', ...formatGitflowSnapshot(snapshot)],
  };
};

const runStatus = (snapshot: GitflowSnapshot): GitflowCommandOutcome => {
  if (!snapshot.available) {
    return {
      exitCode: 1,
      lines: ['GITFLOW STATUS', 'status: unavailable', 'reason: not a git repository'],
    };
  }
  return {
    exitCode: 0,
    lines: ['GITFLOW STATUS', ...formatGitflowSnapshot(snapshot)],
  };
};

const runWorkflow = (snapshot: GitflowSnapshot): GitflowCommandOutcome => {
  if (!snapshot.available) {
    return {
      exitCode: 1,
      lines: ['GITFLOW WORKFLOW', 'No git repository detected.'],
    };
  }

  const branch = snapshot.branch ?? '';
  const lines = ['GITFLOW WORKFLOW', ...formatGitflowSnapshot(snapshot), '', 'Next steps:'];

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

const runReset = (): GitflowCommandOutcome => {
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

export const runGitflowCommand = (
  command: GitflowCommand,
  snapshot: GitflowSnapshot
): GitflowCommandOutcome => {
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
