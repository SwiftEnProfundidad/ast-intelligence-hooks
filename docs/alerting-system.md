# Alerting System (v2.x)

There is no dedicated built-in alerting service in the active deterministic runtime.

## Practical alerting model

Use external systems driven by CI and evidence outputs:

- GitHub required checks (gate/test workflows)
- Workflow failure notifications (GitHub / Slack / Teams integrations)
- Evidence artifact inspection for stage outcome and findings

## Recommended alert conditions

- Any gate workflow failure (`iOS`, `Backend`, `Frontend`, `Android`)
- Deterministic suite failure (`test:deterministic`)
- Heuristics suite failure (`test:heuristics`)
- Evidence missing or invalid (`version != 2.1`) in CI artifact checks

## Example operational policy

- `CRITICAL`/`ERROR` blocks in `PRE_PUSH` or `CI` -> page maintainers
- repeated `WARN` trends across runs -> create backlog issue

## Note

Document concrete alert rules only when a first-class alerting implementation exists in active runtime code.
