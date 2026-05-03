## Why

Pumuki must audit every active enterprise skill through AST Intelligence without losing the legacy consumer menu contract. The current slice closes false positives in TypeScript detectors and establishes the change contract for full skill-to-detector coverage.

## What Changes

- Restore consumer-facing audit behavior around full repository analysis, menu labels, and console output shape.
- Expand skill governance so public and vendored skills are classified as AST-enforced or operational-only.
- Tighten TypeScript detector heuristics to avoid blocking neutral UI/reporting code with configuration and magic-number false positives.
- Keep tracking canonical on `PUMUKI-RESET-MASTER-PLAN.md` instead of retired internal mirrors.

## Capabilities

### New Capabilities

- `skills-ast-enforcement`: Contract for mapping active skills to AST Intelligence rules, detector coverage, evidence summaries, and consumer audit output.

### Modified Capabilities

None.

## Impact

- Affected code: TypeScript detector implementation, consumer framework menu, evidence platform summaries, skill lock governance, and tests.
- Affected documents: root tracking contract and OpenSpec change artifacts.
- No public CLI breaking change is intended for consumers.
