import type { RuleSet } from '../../RuleSet';

export const fsPromisesFileOperationsRules: RuleSet = [
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
];
