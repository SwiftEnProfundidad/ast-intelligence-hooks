import type { RuleSet } from '../../RuleSet';

export const fsSyncRules: RuleSet = [
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
  {
    id: 'heuristics.ts.fs-append-file-sync.ast',
    description: 'Detects fs.appendFileSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-append-file-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.appendFileSync usage.',
      code: 'HEURISTICS_FS_APPEND_FILE_SYNC_AST',
    },
  },
];
