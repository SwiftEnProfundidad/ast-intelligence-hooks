# AST Heuristics Rule Pack

## Pack

- `astHeuristicsRuleSet@0.4.0`
- Platform: `frontend`, `backend`, `ios`, `android` (heuristic signals)

## Source

- `core/rules/presets/astHeuristicsRuleSet.ts`

## Activation

- Disabled by default.
- Enabled when `PUMUKI_ENABLE_AST_HEURISTICS` is truthy (`1`, `true`, `yes`, `on`).

## Evaluation model

- Semantic and token-aware extractors emit typed `Heuristic` facts.
- The shared evaluator matches those facts through declarative `Heuristic` conditions.
- Findings are emitted by standard rule evaluation flow and included in `.ai_evidence.json`.

## Stage severity maturity

- `PRE_COMMIT` keeps all heuristic findings at `WARN`.
- `PRE_PUSH` and `CI` promote selected high-confidence heuristic rules to `ERROR`:
  - `heuristics.ts.console-log.ast`
  - `heuristics.ts.console-error.ast`
  - `heuristics.ts.eval.ast`
  - `heuristics.ts.function-constructor.ast`
  - `heuristics.ts.set-timeout-string.ast`
  - `heuristics.ts.set-interval-string.ast`
  - `heuristics.ts.new-promise-async.ast`
  - `heuristics.ts.with-statement.ast`
  - `heuristics.ts.process-exit.ast`
  - `heuristics.ts.delete-operator.ast`
  - `heuristics.ts.inner-html.ast`
  - `heuristics.ts.document-write.ast`
  - `heuristics.ts.insert-adjacent-html.ast`
  - `heuristics.ts.child-process-import.ast`
  - `heuristics.ts.process-env-mutation.ast`
  - `heuristics.ts.fs-write-file-sync.ast`
  - `heuristics.ts.child-process-exec-sync.ast`
  - `heuristics.ts.child-process-exec.ast`
  - `heuristics.ts.child-process-spawn-sync.ast`
  - `heuristics.ts.child-process-spawn.ast`
  - `heuristics.ts.child-process-fork.ast`
  - `heuristics.ts.child-process-exec-file-sync.ast`
  - `heuristics.ts.child-process-exec-file.ast`
  - `heuristics.ts.fs-append-file-sync.ast`
  - `heuristics.ts.explicit-any.ast`
  - `heuristics.ts.debugger.ast`
  - `heuristics.ios.force-unwrap.ast`
  - `heuristics.ios.anyview.ast`
  - `heuristics.ios.force-try.ast`
  - `heuristics.ios.force-cast.ast`
  - `heuristics.ios.callback-style.ast`
  - `heuristics.android.thread-sleep.ast`
  - `heuristics.android.globalscope.ast`
  - `heuristics.android.run-blocking.ast`
- Remaining heuristic rules stay at `WARN` across all stages.

## Current pilot rules

- `heuristics.ts.empty-catch.ast`
- `heuristics.ts.explicit-any.ast`
- `heuristics.ts.console-log.ast`
- `heuristics.ts.console-error.ast`
- `heuristics.ts.eval.ast`
- `heuristics.ts.function-constructor.ast`
- `heuristics.ts.set-timeout-string.ast`
- `heuristics.ts.set-interval-string.ast`
- `heuristics.ts.new-promise-async.ast`
- `heuristics.ts.with-statement.ast`
- `heuristics.ts.process-exit.ast`
- `heuristics.ts.delete-operator.ast`
- `heuristics.ts.inner-html.ast`
- `heuristics.ts.document-write.ast`
- `heuristics.ts.insert-adjacent-html.ast`
- `heuristics.ts.child-process-import.ast`
- `heuristics.ts.process-env-mutation.ast`
- `heuristics.ts.fs-write-file-sync.ast`
- `heuristics.ts.child-process-exec-sync.ast`
- `heuristics.ts.child-process-exec.ast`
- `heuristics.ts.child-process-spawn-sync.ast`
- `heuristics.ts.child-process-spawn.ast`
- `heuristics.ts.child-process-fork.ast`
- `heuristics.ts.child-process-exec-file-sync.ast`
- `heuristics.ts.child-process-exec-file.ast`
- `heuristics.ts.fs-append-file-sync.ast`
- `heuristics.ts.debugger.ast`
- `heuristics.ios.force-unwrap.ast`
- `heuristics.ios.anyview.ast`
- `heuristics.ios.force-try.ast`
- `heuristics.ios.force-cast.ast`
- `heuristics.ios.callback-style.ast`
- `heuristics.android.thread-sleep.ast`
- `heuristics.android.globalscope.ast`
- `heuristics.android.run-blocking.ast`
