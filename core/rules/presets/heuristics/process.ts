import type { RuleSet } from '../../RuleSet';

export const processRules: RuleSet = [
  {
    id: 'heuristics.ts.process-exit.ast',
    description: 'Detects process.exit invocations in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.process-exit.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected process.exit usage.',
      code: 'HEURISTICS_PROCESS_EXIT_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-import.ast',
    description: 'Detects child_process import/require usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-import.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected child_process import/require usage.',
      code: 'HEURISTICS_CHILD_PROCESS_IMPORT_AST',
    },
  },
  {
    id: 'heuristics.ts.process-env-mutation.ast',
    description: 'Detects process.env mutation in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.process-env-mutation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected process.env mutation.',
      code: 'HEURISTICS_PROCESS_ENV_MUTATION_AST',
    },
  },
  {
    id: 'heuristics.ts.dynamic-shell-invocation.ast',
    description:
      'Detects dynamic shell command invocation through exec/execSync in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.dynamic-shell-invocation.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected dynamic shell command invocation.',
      code: 'HEURISTICS_DYNAMIC_SHELL_INVOCATION_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-shell-true.ast',
    description:
      'Detects child_process spawn/execFile calls with shell=true in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-shell-true.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected child_process call with shell=true.',
      code: 'HEURISTICS_CHILD_PROCESS_SHELL_TRUE_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-exec-file-untrusted-args.ast',
    description:
      'Detects execFile/execFileSync usage with non-literal args arrays in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-exec-file-untrusted-args.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected execFile/execFileSync with non-literal args array.',
      code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_UNTRUSTED_ARGS_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-exec-sync.ast',
    description: 'Detects execSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-exec-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected execSync usage.',
      code: 'HEURISTICS_CHILD_PROCESS_EXEC_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-exec.ast',
    description: 'Detects exec usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-exec.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected exec usage.',
      code: 'HEURISTICS_CHILD_PROCESS_EXEC_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-spawn-sync.ast',
    description: 'Detects spawnSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-spawn-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected spawnSync usage.',
      code: 'HEURISTICS_CHILD_PROCESS_SPAWN_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-spawn.ast',
    description: 'Detects spawn usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-spawn.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected spawn usage.',
      code: 'HEURISTICS_CHILD_PROCESS_SPAWN_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-fork.ast',
    description: 'Detects fork usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-fork.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fork usage.',
      code: 'HEURISTICS_CHILD_PROCESS_FORK_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-exec-file-sync.ast',
    description: 'Detects execFileSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-exec-file-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected execFileSync usage.',
      code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.child-process-exec-file.ast',
    description: 'Detects execFile usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.child-process-exec-file.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected execFile usage.',
      code: 'HEURISTICS_CHILD_PROCESS_EXEC_FILE_AST',
    },
  },
];
