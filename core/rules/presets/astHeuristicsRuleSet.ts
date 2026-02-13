import type { RuleSet } from '../RuleSet';

export const astHeuristicsRuleSet: RuleSet = [
  {
    id: 'heuristics.ts.empty-catch.ast',
    description: 'Detects empty catch blocks in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.empty-catch.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected an empty catch block.',
      code: 'HEURISTICS_EMPTY_CATCH_AST',
    },
  },
  {
    id: 'heuristics.ts.explicit-any.ast',
    description: 'Detects explicit any usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.explicit-any.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected explicit any usage.',
      code: 'HEURISTICS_EXPLICIT_ANY_AST',
    },
  },
  {
    id: 'heuristics.ts.console-log.ast',
    description: 'Detects console.log invocations in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.console-log.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected console.log usage.',
      code: 'HEURISTICS_CONSOLE_LOG_AST',
    },
  },
  {
    id: 'heuristics.ts.console-error.ast',
    description: 'Detects console.error invocations in TypeScript production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.console-error.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected console.error usage.',
      code: 'HEURISTICS_CONSOLE_ERROR_AST',
    },
  },
  {
    id: 'heuristics.ts.eval.ast',
    description: 'Detects eval invocations in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.eval.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected eval usage.',
      code: 'HEURISTICS_EVAL_AST',
    },
  },
  {
    id: 'heuristics.ts.function-constructor.ast',
    description: 'Detects Function constructor usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.function-constructor.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Function constructor usage.',
      code: 'HEURISTICS_FUNCTION_CONSTRUCTOR_AST',
    },
  },
  {
    id: 'heuristics.ts.set-timeout-string.ast',
    description: 'Detects setTimeout string callbacks in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.set-timeout-string.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected setTimeout with a string callback.',
      code: 'HEURISTICS_SET_TIMEOUT_STRING_AST',
    },
  },
  {
    id: 'heuristics.ts.set-interval-string.ast',
    description: 'Detects setInterval string callbacks in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.set-interval-string.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected setInterval with a string callback.',
      code: 'HEURISTICS_SET_INTERVAL_STRING_AST',
    },
  },
  {
    id: 'heuristics.ts.new-promise-async.ast',
    description: 'Detects async Promise executor usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.new-promise-async.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected async Promise executor usage.',
      code: 'HEURISTICS_NEW_PROMISE_ASYNC_AST',
    },
  },
  {
    id: 'heuristics.ts.with-statement.ast',
    description: 'Detects with-statement usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.with-statement.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected with-statement usage.',
      code: 'HEURISTICS_WITH_STATEMENT_AST',
    },
  },
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
    id: 'heuristics.ts.delete-operator.ast',
    description: 'Detects delete-operator usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.delete-operator.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected delete-operator usage.',
      code: 'HEURISTICS_DELETE_OPERATOR_AST',
    },
  },
  {
    id: 'heuristics.ts.inner-html.ast',
    description: 'Detects innerHTML assignments in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.inner-html.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected innerHTML assignment.',
      code: 'HEURISTICS_INNER_HTML_AST',
    },
  },
  {
    id: 'heuristics.ts.document-write.ast',
    description: 'Detects document.write usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.document-write.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected document.write usage.',
      code: 'HEURISTICS_DOCUMENT_WRITE_AST',
    },
  },
  {
    id: 'heuristics.ts.insert-adjacent-html.ast',
    description: 'Detects insertAdjacentHTML usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.insert-adjacent-html.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected insertAdjacentHTML usage.',
      code: 'HEURISTICS_INSERT_ADJACENT_HTML_AST',
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
    id: 'heuristics.ts.hardcoded-secret-token.ast',
    description:
      'Detects hardcoded secret/token/password/apiKey-like string literals in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.hardcoded-secret-token.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected hardcoded secret/token literal.',
      code: 'HEURISTICS_HARDCODED_SECRET_TOKEN_AST',
    },
  },
  {
    id: 'heuristics.ts.weak-crypto-hash.ast',
    description:
      'Detects weak crypto hash algorithms (md5/sha1) in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.weak-crypto-hash.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected weak crypto hash usage (md5/sha1).',
      code: 'HEURISTICS_WEAK_CRYPTO_HASH_AST',
    },
  },
  {
    id: 'heuristics.ts.insecure-token-math-random.ast',
    description:
      'Detects insecure token/secret generation using Math.random in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.insecure-token-math-random.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected insecure token generation via Math.random.',
      code: 'HEURISTICS_INSECURE_TOKEN_MATH_RANDOM_AST',
    },
  },
  {
    id: 'heuristics.ts.insecure-token-date-now.ast',
    description:
      'Detects insecure token/secret generation using Date.now in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.insecure-token-date-now.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected insecure token generation via Date.now.',
      code: 'HEURISTICS_INSECURE_TOKEN_DATE_NOW_AST',
    },
  },
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
  {
    id: 'heuristics.ts.fs-lchmod-callback.ast',
    description: 'Detects fs.lchmod callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-lchmod-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.lchmod callback usage.',
      code: 'HEURISTICS_FS_LCHMOD_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-unlink-callback.ast',
    description: 'Detects fs.unlink callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-unlink-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.unlink callback usage.',
      code: 'HEURISTICS_FS_UNLINK_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-readlink-callback.ast',
    description: 'Detects fs.readlink callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-readlink-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readlink callback usage.',
      code: 'HEURISTICS_FS_READLINK_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-symlink-callback.ast',
    description: 'Detects fs.symlink callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-symlink-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.symlink callback usage.',
      code: 'HEURISTICS_FS_SYMLINK_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-link-callback.ast',
    description: 'Detects fs.link callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-link-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.link callback usage.',
      code: 'HEURISTICS_FS_LINK_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-mkdtemp-callback.ast',
    description: 'Detects fs.mkdtemp callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-mkdtemp-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.mkdtemp callback usage.',
      code: 'HEURISTICS_FS_MKDTEMP_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-opendir-callback.ast',
    description: 'Detects fs.opendir callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-opendir-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.opendir callback usage.',
      code: 'HEURISTICS_FS_OPENDIR_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-open-callback.ast',
    description: 'Detects fs.open callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-open-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.open callback usage.',
      code: 'HEURISTICS_FS_OPEN_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-cp-callback.ast',
    description: 'Detects fs.cp callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-cp-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.cp callback usage.',
      code: 'HEURISTICS_FS_CP_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-close-callback.ast',
    description: 'Detects fs.close callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-close-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.close callback usage.',
      code: 'HEURISTICS_FS_CLOSE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-read-callback.ast',
    description: 'Detects fs.read callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-read-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.read callback usage.',
      code: 'HEURISTICS_FS_READ_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-readv-callback.ast',
    description: 'Detects fs.readv callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-readv-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.readv callback usage.',
      code: 'HEURISTICS_FS_READV_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-writev-callback.ast',
    description: 'Detects fs.writev callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-writev-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.writev callback usage.',
      code: 'HEURISTICS_FS_WRITEV_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-write-callback.ast',
    description: 'Detects fs.write callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-write-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.write callback usage.',
      code: 'HEURISTICS_FS_WRITE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-fsync-callback.ast',
    description: 'Detects fs.fsync callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fsync-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fsync callback usage.',
      code: 'HEURISTICS_FS_FSYNC_CALLBACK_AST',
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
    id: 'heuristics.ts.fs-fdatasync-callback.ast',
    description: 'Detects fs.fdatasync callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fdatasync-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fdatasync callback usage.',
      code: 'HEURISTICS_FS_FDATASYNC_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-fchown-callback.ast',
    description: 'Detects fs.fchown callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fchown-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fchown callback usage.',
      code: 'HEURISTICS_FS_FCHOWN_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-fchmod-callback.ast',
    description: 'Detects fs.fchmod callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fchmod-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fchmod callback usage.',
      code: 'HEURISTICS_FS_FCHMOD_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-fstat-callback.ast',
    description: 'Detects fs.fstat callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-fstat-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.fstat callback usage.',
      code: 'HEURISTICS_FS_FSTAT_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-ftruncate-callback.ast',
    description: 'Detects fs.ftruncate callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-ftruncate-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.ftruncate callback usage.',
      code: 'HEURISTICS_FS_FTRUNCATE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-truncate-callback.ast',
    description: 'Detects fs.truncate callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-truncate-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.truncate callback usage.',
      code: 'HEURISTICS_FS_TRUNCATE_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-futimes-callback.ast',
    description: 'Detects fs.futimes callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-futimes-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.futimes callback usage.',
      code: 'HEURISTICS_FS_FUTIMES_CALLBACK_AST',
    },
  },
  {
    id: 'heuristics.ts.fs-lutimes-callback.ast',
    description: 'Detects fs.lutimes callback-style usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-lutimes-callback.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.lutimes callback usage.',
      code: 'HEURISTICS_FS_LUTIMES_CALLBACK_AST',
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
  {
    id: 'heuristics.ts.debugger.ast',
    description: 'Detects debugger statements in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.debugger.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected debugger statement usage.',
      code: 'HEURISTICS_DEBUGGER_AST',
    },
  },
  {
    id: 'heuristics.ios.force-unwrap.ast',
    description: 'Detects Swift force unwrap usage in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.force-unwrap.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected force unwrap usage.',
      code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
    },
  },
  {
    id: 'heuristics.ios.anyview.ast',
    description: 'Detects Swift AnyView type-erasure usage in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.anyview.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected AnyView usage.',
      code: 'HEURISTICS_IOS_ANYVIEW_AST',
    },
  },
  {
    id: 'heuristics.ios.force-try.ast',
    description: 'Detects Swift force try usage in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.force-try.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected force try usage.',
      code: 'HEURISTICS_IOS_FORCE_TRY_AST',
    },
  },
  {
    id: 'heuristics.ios.force-cast.ast',
    description: 'Detects Swift force cast usage in production code.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.force-cast.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected force cast usage.',
      code: 'HEURISTICS_IOS_FORCE_CAST_AST',
    },
  },
  {
    id: 'heuristics.ios.callback-style.ast',
    description: 'Detects callback-style signatures outside approved iOS bridge layers.',
    severity: 'WARN',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.callback-style.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected callback-style API signature outside bridge layers.',
      code: 'HEURISTICS_IOS_CALLBACK_STYLE_AST',
    },
  },
  {
    id: 'heuristics.android.thread-sleep.ast',
    description: 'Detects Thread.sleep usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.thread-sleep.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Thread.sleep usage in production Kotlin code.',
      code: 'HEURISTICS_ANDROID_THREAD_SLEEP_AST',
    },
  },
  {
    id: 'heuristics.android.globalscope.ast',
    description: 'Detects GlobalScope usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.globalscope.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected GlobalScope coroutine usage in production Kotlin code.',
      code: 'HEURISTICS_ANDROID_GLOBAL_SCOPE_AST',
    },
  },
  {
    id: 'heuristics.android.run-blocking.ast',
    description: 'Detects runBlocking usage in Android production Kotlin files.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.android.run-blocking.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected runBlocking usage in production Kotlin code.',
      code: 'HEURISTICS_ANDROID_RUN_BLOCKING_AST',
    },
  },
];
