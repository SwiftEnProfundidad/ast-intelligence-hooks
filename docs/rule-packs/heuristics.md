# AST Heuristics Rule Pack

## Pack

- `astHeuristicsRuleSet@0.2.0`
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
  - `heuristics.ios.force-unwrap.ast`
  - `heuristics.ios.anyview.ast`
  - `heuristics.android.thread-sleep.ast`
  - `heuristics.android.globalscope.ast`
  - `heuristics.android.run-blocking.ast`
- Remaining heuristic rules stay at `WARN` across all stages.

## Current pilot rules

- `heuristics.ts.empty-catch.ast`
- `heuristics.ts.explicit-any.ast`
- `heuristics.ts.console-log.ast`
- `heuristics.ios.force-unwrap.ast`
- `heuristics.ios.anyview.ast`
- `heuristics.ios.callback-style.ast`
- `heuristics.android.thread-sleep.ast`
- `heuristics.android.globalscope.ast`
- `heuristics.android.run-blocking.ast`
