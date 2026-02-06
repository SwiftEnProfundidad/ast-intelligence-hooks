# Phase 3 - Interactive CLI Layer

## Objective

Provide an extensible menu-based CLI on top of integrations without modifying core evaluation logic.

## Commits

- `0c30dd5` feat(cli): add interactive framework menu for staged and range evaluation
- `1852c6a` chore(cli): wire interactive framework menu script

## Scope

- Interactive menu:
  - `scripts/framework-menu.ts`
  - `scripts/framework-menu.cli.ts`
- Added npm script:
  - `package.json` -> `framework:menu`
- README usage update:
  - `README.md`

## Menu capabilities

- Evaluate staged with PRE_COMMIT policy
- Evaluate range with PRE_PUSH / CI policies
- Run platform CI gates
- Generate/read `.ai_evidence.json`

## Validation status

- CLI composes existing integrations and does not alter core contracts.
