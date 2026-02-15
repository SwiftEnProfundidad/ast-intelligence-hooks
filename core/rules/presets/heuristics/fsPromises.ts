import type { RuleSet } from '../../RuleSet';

export const fsPromisesRules: RuleSet = [
  {
    id: 'heuristics.ts.fs-promises-write-file.ast',
    description: 'Detects fs.promises.writeFile usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-write-file.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.writeFile usage.',
      code: 'HEURISTICS_FS_PROMISES_WRITE_FILE_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-append-file.ast',
    description: 'Detects fs.promises.appendFile usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-append-file.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.appendFile usage.',
      code: 'HEURISTICS_FS_PROMISES_APPEND_FILE_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-rm.ast',
    description: 'Detects fs.promises.rm usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-rm.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.rm usage.',
      code: 'HEURISTICS_FS_PROMISES_RM_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-unlink.ast',
    description: 'Detects fs.promises.unlink usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-unlink.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.unlink usage.',
      code: 'HEURISTICS_FS_PROMISES_UNLINK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-read-file.ast',
    description: 'Detects fs.promises.readFile usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-read-file.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.readFile usage.',
      code: 'HEURISTICS_FS_PROMISES_READ_FILE_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-readdir.ast',
    description: 'Detects fs.promises.readdir usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-readdir.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.readdir usage.',
      code: 'HEURISTICS_FS_PROMISES_READDIR_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-mkdir.ast',
    description: 'Detects fs.promises.mkdir usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-mkdir.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.mkdir usage.',
      code: 'HEURISTICS_FS_PROMISES_MKDIR_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-stat.ast',
    description: 'Detects fs.promises.stat usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-stat.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.stat usage.',
      code: 'HEURISTICS_FS_PROMISES_STAT_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-copy-file.ast',
    description: 'Detects fs.promises.copyFile usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-copy-file.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.copyFile usage.',
      code: 'HEURISTICS_FS_PROMISES_COPY_FILE_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-promises-rename.ast',
    description: 'Detects fs.promises.rename usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-promises-rename.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.promises.rename usage.',
      code: 'HEURISTICS_FS_PROMISES_RENAME_AST',
    },
  },
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
