# Markdown Hygiene Audit (v2.x)

## Goal

Classify documentation files as `KEEP`, `UPDATE`, `ARCHIVE`, or `DELETE` to remove legacy drift while preserving the current deterministic framework model.

## Scope and criteria

- Source of truth is current v2.x flow:
  - `Facts -> Rules -> Gate -> Evidence v2.1`
  - stages `PRE_COMMIT`, `PRE_PUSH`, `CI`
  - severities `CRITICAL`, `ERROR`, `WARN`, `INFO`
- Documents referencing removed legacy behavior are considered stale:
  - `HIGH/MEDIUM/LOW` severity model
  - old hook daemons/watchers as mandatory runtime
  - old option menus and commands no longer wired in v2.x
  - obsolete installation/runtime paths

## Priority set (user-facing docs)

| File | Status | Reason | Action |
|---|---|---|---|
| `README.md` | `UPDATE` | Mixes current framework model with legacy operational sections. | Keep positioning + v2.x core; trim obsolete legacy runtime details. |
| `docs/USAGE.md` | `UPDATE` | Contains outdated options/commands and old severity language. | Rewrite around stage runners, shared evaluator, evidence v2.1. |
| `docs/HOW_IT_WORKS.md` | `ARCHIVE` | Primarily documents previous architecture/runtime layout. | Move to historical archive and replace with concise v2.x flow doc. |
| `docs/API_REFERENCE.md` | `ARCHIVE` | Lists APIs and semantics no longer aligned with current implementation. | Archive and recreate minimal v2.x API reference. |

## Secondary set (legacy-heavy docs)

| File | Status | Reason | Action |
|---|---|---|---|
| `docs/RELEASE_NOTES_5.3.4.md` | `ARCHIVE` | Historical release details for pre-v2 line. | Archive under legacy section. |
| `docs/MIGRATION_5.3.4.md` | `ARCHIVE` | Migration guide for older model and options. | Archive with clear legacy tag. |
| `docs/SEVERITY_AUDIT.md` | `UPDATE` | Terminology may conflict with v2.x severity model. | Keep only sections still valid for current rules. |
| `docs/alerting-system.md` | `UPDATE` | Operational details not mapped to deterministic stage flow. | Align alerts with `PRE_COMMIT/PRE_PUSH/CI` outcomes. |

## Stable docs (keep as baseline)

- `docs/evidence-v2.1.md`
- `docs/rule-packs/*`
- `docs/pr-reports/*`
- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`

## Execution batches

1. Batch A: rewrite `README.md` and `docs/USAGE.md` for v2.x.
2. Batch B: archive + replacement stubs for `docs/HOW_IT_WORKS.md` and `docs/API_REFERENCE.md`.
3. Batch C: archive legacy migration/release docs from 5.3.4 line.
4. Batch D: normalize remaining operational docs (`SEVERITY_AUDIT`, `alerting-system`).

## Tracking

Use `docs/TODO.md` as backlog checkpoint and update `docs/pr-reports/phase-4-docs.md` when each batch closes.
