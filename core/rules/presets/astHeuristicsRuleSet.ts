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
