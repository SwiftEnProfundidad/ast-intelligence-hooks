import type { RuleSet } from '../../RuleSet';

export const fsPromisesMetadataRules: RuleSet = [
  {
    id: 'heuristics.ts.fs-promises-access.ast',
    description: 'Detects fs.promises.access usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-access.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.access usage.',
      code: 'HEURISTICS_FS_PROMISES_ACCESS_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-chmod.ast',
    description: 'Detects fs.promises.chmod usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-chmod.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.chmod usage.',
      code: 'HEURISTICS_FS_PROMISES_CHMOD_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-chown.ast',
    description: 'Detects fs.promises.chown usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-chown.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.chown usage.',
      code: 'HEURISTICS_FS_PROMISES_CHOWN_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-utimes.ast',
    description: 'Detects fs.promises.utimes usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-utimes.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.utimes usage.',
      code: 'HEURISTICS_FS_PROMISES_UTIMES_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-lstat.ast',
    description: 'Detects fs.promises.lstat usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-lstat.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.lstat usage.',
      code: 'HEURISTICS_FS_PROMISES_LSTAT_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-realpath.ast',
    description: 'Detects fs.promises.realpath usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-realpath.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.realpath usage.',
      code: 'HEURISTICS_FS_PROMISES_REALPATH_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-symlink.ast',
    description: 'Detects fs.promises.symlink usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-symlink.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.symlink usage.',
      code: 'HEURISTICS_FS_PROMISES_SYMLINK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-link.ast',
    description: 'Detects fs.promises.link usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-link.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.link usage.',
      code: 'HEURISTICS_FS_PROMISES_LINK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-readlink.ast',
    description: 'Detects fs.promises.readlink usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-readlink.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.readlink usage.',
      code: 'HEURISTICS_FS_PROMISES_READLINK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-open.ast',
    description: 'Detects fs.promises.open usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-open.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.open usage.',
      code: 'HEURISTICS_FS_PROMISES_OPEN_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-opendir.ast',
    description: 'Detects fs.promises.opendir usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-opendir.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.opendir usage.',
      code: 'HEURISTICS_FS_PROMISES_OPENDIR_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-cp.ast',
    description: 'Detects fs.promises.cp usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-cp.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.cp usage.',
      code: 'HEURISTICS_FS_PROMISES_CP_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-mkdtemp.ast',
    description: 'Detects fs.promises.mkdtemp usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-mkdtemp.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.mkdtemp usage.',
      code: 'HEURISTICS_FS_PROMISES_MKDTEMP_AST',
    },
  },
];
