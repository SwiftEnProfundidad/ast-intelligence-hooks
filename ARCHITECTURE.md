# Conceptual Architecture

This file is the conceptual entry point for the framework.

## Core model

Pumuki v2.x follows a deterministic governance pipeline:

1. `Facts` extraction from Git scope (staged or commit range)
2. Declarative `Rules` evaluation (baseline + project overrides)
3. `Gate` decision by stage policy (`PRE_COMMIT`, `PRE_PUSH`, `CI`)
4. Deterministic `ai_evidence v2.1` write (`snapshot` + `ledger`)

## Layer boundaries

- `core/*`: pure domain and rule evaluation (no IO)
- `integrations/*`: adapters for Git, config loading, evidence persistence, CI hooks
- `scripts/*` and workflows: operational entrypoints on top of integrations

## Canonical contract

The authoritative architecture contract lives in:

- `docs/ARCHITECTURE.md`

Use this file for high-level orientation and `docs/ARCHITECTURE.md` for normative details, invariants, and control primitives.
