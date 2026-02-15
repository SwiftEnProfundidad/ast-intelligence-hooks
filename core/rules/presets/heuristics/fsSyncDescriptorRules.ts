import type { RuleSet } from '../../RuleSet';

export const fsSyncDescriptorRules: RuleSet = [
  {
    id: 'heuristics.ts.fs-fstat-sync.ast',
    description: 'Detects fs.fstatSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fstat-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fstatSync usage.',
      code: 'HEURISTICS_FS_FSTAT_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-ftruncate-sync.ast',
    description: 'Detects fs.ftruncateSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-ftruncate-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.ftruncateSync usage.',
      code: 'HEURISTICS_FS_FTRUNCATE_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-futimes-sync.ast',
    description: 'Detects fs.futimesSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-futimes-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.futimesSync usage.',
      code: 'HEURISTICS_FS_FUTIMES_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-lutimes-sync.ast',
    description: 'Detects fs.lutimesSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-lutimes-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.lutimesSync usage.',
      code: 'HEURISTICS_FS_LUTIMES_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-readv-sync.ast',
    description: 'Detects fs.readvSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-readv-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readvSync usage.',
      code: 'HEURISTICS_FS_READV_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-writev-sync.ast',
    description: 'Detects fs.writevSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-writev-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.writevSync usage.',
      code: 'HEURISTICS_FS_WRITEV_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-write-sync.ast',
    description: 'Detects fs.writeSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-write-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.writeSync usage.',
      code: 'HEURISTICS_FS_WRITE_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-fsync-sync.ast',
    description: 'Detects fs.fsyncSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fsync-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fsyncSync usage.',
      code: 'HEURISTICS_FS_FSYNC_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-fdatasync-sync.ast',
    description: 'Detects fs.fdatasyncSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fdatasync-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fdatasyncSync usage.',
      code: 'HEURISTICS_FS_FDATASYNC_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-close-sync.ast',
    description: 'Detects fs.closeSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-close-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.closeSync usage.',
      code: 'HEURISTICS_FS_CLOSE_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-read-sync.ast',
    description: 'Detects fs.readSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-read-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readSync usage.',
      code: 'HEURISTICS_FS_READ_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-readlink-sync.ast',
    description: 'Detects fs.readlinkSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-readlink-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readlinkSync usage.',
      code: 'HEURISTICS_FS_READLINK_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-symlink-sync.ast',
    description: 'Detects fs.symlinkSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-symlink-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.symlinkSync usage.',
      code: 'HEURISTICS_FS_SYMLINK_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-link-sync.ast',
    description: 'Detects fs.linkSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-link-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.linkSync usage.',
      code: 'HEURISTICS_FS_LINK_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-cp-sync.ast',
    description: 'Detects fs.cpSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-cp-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.cpSync usage.',
      code: 'HEURISTICS_FS_CP_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-open-sync.ast',
    description: 'Detects fs.openSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-open-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.openSync usage.',
      code: 'HEURISTICS_FS_OPEN_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-opendir-sync.ast',
    description: 'Detects fs.opendirSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-opendir-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.opendirSync usage.',
      code: 'HEURISTICS_FS_OPENDIR_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-mkdtemp-sync.ast',
    description: 'Detects fs.mkdtempSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-mkdtemp-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.mkdtempSync usage.',
      code: 'HEURISTICS_FS_MKDTEMP_SYNC_AST',
    },
  },
];
