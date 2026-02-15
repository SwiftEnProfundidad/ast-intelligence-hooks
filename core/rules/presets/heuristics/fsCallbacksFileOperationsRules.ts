import type { RuleSet } from '../../RuleSet';

export const fsCallbacksFileOperationsRules: RuleSet = [
  {
    id: 'heuristics.ts.fs-utimes-callback.ast',
    description: 'Detects fs.utimes callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-utimes-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.utimes callback usage.',
      code: 'HEURISTICS_FS_UTIMES_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-watch-callback.ast',
    description: 'Detects fs.watch callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-watch-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.watch callback usage.',
      code: 'HEURISTICS_FS_WATCH_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-watch-file-callback.ast',
    description: 'Detects fs.watchFile callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-watch-file-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.watchFile callback usage.',
      code: 'HEURISTICS_FS_WATCH_FILE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-unwatch-file-callback.ast',
    description: 'Detects fs.unwatchFile callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-unwatch-file-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.unwatchFile callback usage.',
      code: 'HEURISTICS_FS_UNWATCH_FILE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-read-file-callback.ast',
    description: 'Detects fs.readFile callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-read-file-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readFile callback usage.',
      code: 'HEURISTICS_FS_READ_FILE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-exists-callback.ast',
    description: 'Detects fs.exists callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-exists-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.exists callback usage.',
      code: 'HEURISTICS_FS_EXISTS_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-write-file-callback.ast',
    description: 'Detects fs.writeFile callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-write-file-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.writeFile callback usage.',
      code: 'HEURISTICS_FS_WRITE_FILE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-append-file-callback.ast',
    description: 'Detects fs.appendFile callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-append-file-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.appendFile callback usage.',
      code: 'HEURISTICS_FS_APPEND_FILE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-readdir-callback.ast',
    description: 'Detects fs.readdir callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-readdir-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readdir callback usage.',
      code: 'HEURISTICS_FS_READDIR_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-mkdir-callback.ast',
    description: 'Detects fs.mkdir callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-mkdir-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.mkdir callback usage.',
      code: 'HEURISTICS_FS_MKDIR_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-rmdir-callback.ast',
    description: 'Detects fs.rmdir callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-rmdir-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.rmdir callback usage.',
      code: 'HEURISTICS_FS_RMDIR_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-rm-callback.ast',
    description: 'Detects fs.rm callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-rm-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.rm callback usage.',
      code: 'HEURISTICS_FS_RM_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-rename-callback.ast',
    description: 'Detects fs.rename callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-rename-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.rename callback usage.',
      code: 'HEURISTICS_FS_RENAME_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-copy-file-callback.ast',
    description: 'Detects fs.copyFile callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-copy-file-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.copyFile callback usage.',
      code: 'HEURISTICS_FS_COPY_FILE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-stat-callback.ast',
    description: 'Detects fs.stat callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-stat-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.stat callback usage.',
      code: 'HEURISTICS_FS_STAT_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-statfs-callback.ast',
    description: 'Detects fs.statfs callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-statfs-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.statfs callback usage.',
      code: 'HEURISTICS_FS_STATFS_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-lstat-callback.ast',
    description: 'Detects fs.lstat callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-lstat-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.lstat callback usage.',
      code: 'HEURISTICS_FS_LSTAT_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-realpath-callback.ast',
    description: 'Detects fs.realpath callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-realpath-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.realpath callback usage.',
      code: 'HEURISTICS_FS_REALPATH_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-access-callback.ast',
    description: 'Detects fs.access callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-access-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.access callback usage.',
      code: 'HEURISTICS_FS_ACCESS_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-chmod-callback.ast',
    description: 'Detects fs.chmod callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-chmod-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.chmod callback usage.',
      code: 'HEURISTICS_FS_CHMOD_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-chown-callback.ast',
    description: 'Detects fs.chown callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-chown-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.chown callback usage.',
      code: 'HEURISTICS_FS_CHOWN_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-lchown-callback.ast',
    description: 'Detects fs.lchown callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-lchown-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.lchown callback usage.',
      code: 'HEURISTICS_FS_LCHOWN_CALLBACK_AST',
    },
  },
];
