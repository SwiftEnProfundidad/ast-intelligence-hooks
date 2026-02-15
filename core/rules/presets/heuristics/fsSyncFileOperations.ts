import type { RuleSet } from '../../RuleSet';

export const fsSyncFileOperationsRules: RuleSet = [
  {
    id: 'heuristics.ts.fs-write-file-sync.ast',
    description: 'Detects fs.writeFileSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-write-file-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.writeFileSync usage.',
      code: 'HEURISTICS_FS_WRITE_FILE_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-rm-sync.ast',
    description: 'Detects fs.rmSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-rm-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.rmSync usage.',
      code: 'HEURISTICS_FS_RM_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-mkdir-sync.ast',
    description: 'Detects fs.mkdirSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-mkdir-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.mkdirSync usage.',
      code: 'HEURISTICS_FS_MKDIR_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-readdir-sync.ast',
    description: 'Detects fs.readdirSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-readdir-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readdirSync usage.',
      code: 'HEURISTICS_FS_READDIR_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-read-file-sync.ast',
    description: 'Detects fs.readFileSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-read-file-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readFileSync usage.',
      code: 'HEURISTICS_FS_READ_FILE_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-stat-sync.ast',
    description: 'Detects fs.statSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-stat-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.statSync usage.',
      code: 'HEURISTICS_FS_STAT_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-statfs-sync.ast',
    description: 'Detects fs.statfsSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-statfs-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.statfsSync usage.',
      code: 'HEURISTICS_FS_STATFS_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-realpath-sync.ast',
    description: 'Detects fs.realpathSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-realpath-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.realpathSync usage.',
      code: 'HEURISTICS_FS_REALPATH_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-lstat-sync.ast',
    description: 'Detects fs.lstatSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-lstat-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.lstatSync usage.',
      code: 'HEURISTICS_FS_LSTAT_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-exists-sync.ast',
    description: 'Detects fs.existsSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-exists-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.existsSync usage.',
      code: 'HEURISTICS_FS_EXISTS_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-access-sync.ast',
    description: 'Detects fs.accessSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-access-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.accessSync usage.',
      code: 'HEURISTICS_FS_ACCESS_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-utimes-sync.ast',
    description: 'Detects fs.utimesSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-utimes-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.utimesSync usage.',
      code: 'HEURISTICS_FS_UTIMES_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-rename-sync.ast',
    description: 'Detects fs.renameSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-rename-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.renameSync usage.',
      code: 'HEURISTICS_FS_RENAME_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-copy-file-sync.ast',
    description: 'Detects fs.copyFileSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-copy-file-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.copyFileSync usage.',
      code: 'HEURISTICS_FS_COPY_FILE_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-unlink-sync.ast',
    description: 'Detects fs.unlinkSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-unlink-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.unlinkSync usage.',
      code: 'HEURISTICS_FS_UNLINK_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-truncate-sync.ast',
    description: 'Detects fs.truncateSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-truncate-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.truncateSync usage.',
      code: 'HEURISTICS_FS_TRUNCATE_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-rmdir-sync.ast',
    description: 'Detects fs.rmdirSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-rmdir-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.rmdirSync usage.',
      code: 'HEURISTICS_FS_RMDIR_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-chmod-sync.ast',
    description: 'Detects fs.chmodSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-chmod-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.chmodSync usage.',
      code: 'HEURISTICS_FS_CHMOD_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-chown-sync.ast',
    description: 'Detects fs.chownSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-chown-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.chownSync usage.',
      code: 'HEURISTICS_FS_CHOWN_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-fchown-sync.ast',
    description: 'Detects fs.fchownSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fchown-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fchownSync usage.',
      code: 'HEURISTICS_FS_FCHOWN_SYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-fchmod-sync.ast',
    description: 'Detects fs.fchmodSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fchmod-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fchmodSync usage.',
      code: 'HEURISTICS_FS_FCHMOD_SYNC_AST',
    },
  },
];
