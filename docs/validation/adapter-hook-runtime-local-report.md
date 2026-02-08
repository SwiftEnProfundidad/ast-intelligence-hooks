# Adapter Hook Runtime - Local Validation Baseline

## Purpose

Define the expected local validation flow for Adapter hook runtime behavior before requesting a real IDE session replay.

This document is a stable operational baseline and must not store machine-specific paths or one-off execution timestamps.

## Required Commands

1. `npm run install:adapter-hooks-config`
2. `npm run verify:adapter-hooks-runtime`
3. `npm run validate:adapter-hooks-local`
4. `npm run assess:adapter-hooks-session:any`
5. `bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh`

Optional simulated payload checks:

- `run-hook-with-node.sh pre-write-code-hook.js`
- `run-hook-with-node.sh post-write-code-hook.js`

## Expected Outcomes

- Hooks config verification returns `verify OK`.
- Simulated `pre_write_code` can block on known violations (for example, `common.error.empty_catch`).
- Simulated `post_write_code` returns success when no violations are introduced.
- Runtime diagnostics resolve a valid Node binary and version.
- Session helper `assess:adapter-hooks-session:any` reports `PASS`.

## Artifact Targets

Capture local diagnostics under:

- `docs/validation/adapter/artifacts/`
- `.audit_tmp/`

Store timestamped outputs there, not in this runbook.

## Follow-Up

After local baseline is green, execute the real IDE validation flow:

- `docs/validation/adapter-hook-runtime-validation.md`

If real-session checks fail, attach diagnostics in `docs/validation/adapter/artifacts/` and update the support status report.
