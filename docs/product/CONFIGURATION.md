# Configuration (v2.x)

## Project rule overrides

Create a project-level rules file in one of these locations:

- `.pumuki/rules.ts`
- `pumuki.rules.ts`

Example:

```ts
import type { ProjectRulesConfig } from './integrations/config/projectRules';

const config: ProjectRulesConfig = {
  allowOverrideLocked: false,
  rules: [
    {
      id: 'ios.no-print',
      description: 'Disallow print() usage in iOS code.',
      severity: 'CRITICAL',
      scope: { include: ['**/*.swift'] },
      when: { kind: 'FileContent', contains: ['print('] },
      then: {
        kind: 'Finding',
        message: 'print() usage is not allowed.',
        code: 'IOS_NO_PRINT',
      },
    },
  ],
};

export default config;
```

## Override rules of engagement

You can:

- Add new rules.
- Update unlocked rules.
- Raise severity for locked baseline rules.

You cannot (unless `allowOverrideLocked: true`):

- Downgrade locked baseline rules.
- Remove locked baseline rules.
- Replace locked baseline conditions/consequences.

## Skills Contracts and Enforcement Inputs

Repository-level contracts for deterministic skills enforcement:

- `skills.sources.json`
- `skills.lock.json`
- `skills.policy.json`

Typed contract, compiler, and loader/validator modules:

- `integrations/config/skillsLock.ts`
- `integrations/config/skillsPolicy.ts`

Current enforcement scope:

- deterministic schema validation + hashing for lock/policy contracts
- curated template compilation (`skills.sources.json` -> `skills.lock.json`)
- stage-aware policy resolution via `resolvePolicyForStage`
- additive skills-derived rules merged through the shared gate runner
- evidence traceability for active skills bundles and policy source/hash in `.ai_evidence.json`

Ownership model:

- Contracts are repository artifacts and must be committed.
- CI and team members must evaluate the same committed contract files.
- User-home skill sources (`~/.codex/**`) are not runtime inputs for CI gate decisions.

Compile/check commands in the Pumuki source workspace:

```bash
npm run skills:compile
npm run skills:lock:check
```

If you are validating an installed consumer package rather than the Pumuki source repo, invoke the packaged tool directly instead of assuming consumer-local `npm run skills:*` scripts:

```bash
npx --yes tsx@4.21.0 ./node_modules/pumuki/scripts/compile-skills-lock.ts
npx --yes tsx@4.21.0 ./node_modules/pumuki/scripts/compile-skills-lock.ts --check
```

CI guardrail:

- `.github/workflows/ci.yml` includes `Skills Lock Freshness` and fails when committed lock is stale.

Skills rollout runbook:

- `docs/validation/consumer-repositories-skills-rollout-validation.md`

## Stage policies

Defined in `integrations/gate/stagePolicies.ts`:

- `PRE_COMMIT`: block `CRITICAL`, warn from `ERROR`
- `PRE_PUSH`: block `ERROR`, warn from `WARN`
- `CI`: block `ERROR`, warn from `WARN`

## Degraded mode (offline / air-gapped)

Pumuki supports a deterministic degraded contract by stage:

- `PRE_WRITE`
- `PRE_COMMIT`
- `PRE_PUSH`
- `CI`

Resolution precedence:

1. Environment variables (`PUMUKI_DEGRADED_MODE=1`)
2. File contract (`.pumuki/degraded-mode.json`)

Environment variables:

- `PUMUKI_DEGRADED_MODE`: enable/disable (`1|0`, `true|false`, `yes|no`)
- `PUMUKI_DEGRADED_REASON`: operator-visible reason
- `PUMUKI_DEGRADED_ACTION`: global default action (`allow|block`)
- `PUMUKI_DEGRADED_ACTION_PRE_WRITE`: per-stage override
- `PUMUKI_DEGRADED_ACTION_PRE_COMMIT`: per-stage override
- `PUMUKI_DEGRADED_ACTION_PRE_PUSH`: per-stage override
- `PUMUKI_DEGRADED_ACTION_CI`: per-stage override

File contract (`.pumuki/degraded-mode.json`):

```json
{
  "version": "1.0",
  "enabled": true,
  "reason": "offline-airgapped",
  "stages": {
    "PRE_WRITE": "block",
    "PRE_COMMIT": "allow",
    "PRE_PUSH": "block",
    "CI": "block"
  }
}
```

Runtime behavior:

- `action=block`:
  - gate adds finding `governance.degraded-mode.blocked`
  - SDD returns `SDD_DEGRADED_MODE_BLOCKED`
- `action=allow`:
  - gate adds informational finding `governance.degraded-mode.active`
  - SDD returns `ALLOWED` with degraded metadata in `decision.details`

Traceability:

- `policyTrace.degraded` is emitted for gate stages.
- hook summaries include `degraded_mode`, `degraded_action`, and `degraded_reason` when active.
- evidence/telemetry include degraded metadata in policy trace when available.

## SDD sync-docs learning artifact

When `pumuki sdd sync-docs` runs with `--change=<change-id>`, the command emits a machine-readable learning payload.

Write path:

- `openspec/changes/<change-id>/learning.json`

Payload schema (`v1.0`):

```json
{
  "version": "1.0",
  "change_id": "rgo-1700-01",
  "stage": "PRE_COMMIT",
  "task": "P12.F2.T67",
  "generated_at": "2026-03-04T10:05:00.000Z",
  "failed_patterns": ["ai-gate.blocked"],
  "successful_patterns": ["sync-docs.completed", "sync-docs.updated"],
  "rule_updates": [
    "ai-gate.unblock.required",
    "ai-gate.violation.EVIDENCE_STALE.review"
  ],
  "gate_anomalies": ["ai-gate.violation.EVIDENCE_STALE"],
  "sync_docs": {
    "updated": true,
    "file_paths": [
      "docs/technical/08-validation/refactor/pumuki-integration-feedback.md"
    ]
  }
}
```

Behavior:

- `--dry-run`: includes learning payload in JSON output with `learning.written=false` and does not write files.
- non dry-run: persists `learning.json` deterministically and reports digest/path in output.
- `rule_updates`: deterministic recommendations derived from evidence/gate signals (`missing`, `invalid`, `blocked`, `allowed`).
- dedicated command: `pumuki sdd learn --change=<id> [--stage=<stage>] [--task=<task>] [--dry-run] [--json]` generates/persists the same artifact without requiring `sync-docs`.
- orchestration command: `pumuki sdd auto-sync --change=<id> [--stage=<stage>] [--task=<task>] [--dry-run] [--json]` executes deterministic docs sync plus learning generation in one step.
- safety limit: `--from-evidence` must resolve inside the repository root; path traversal/outside-repo paths are blocked.

## Gate telemetry export (optional)

Structured telemetry output is disabled by default and can be enabled with environment variables:

- `PUMUKI_TELEMETRY_JSONL_PATH`:
  - JSONL file path for `telemetry_event_v1` records.
  - Accepts absolute path or repo-relative path.
- `PUMUKI_TELEMETRY_JSONL_MAX_BYTES`:
  - Optional max size for JSONL file growth.
  - When current file size plus next event exceeds this value, current file rotates to `<path>.1` before append.
- `PUMUKI_TELEMETRY_OTEL_ENDPOINT`:
  - OTLP HTTP logs endpoint (`/v1/logs`).
- `PUMUKI_TELEMETRY_OTEL_SERVICE_NAME`:
  - Optional service name for OTel payload (`default: pumuki`).
- `PUMUKI_TELEMETRY_OTEL_TIMEOUT_MS`:
  - Optional timeout for OTel dispatch in milliseconds (`default: 1500`).

Notes:

- You can enable JSONL only, OTel only, or both.
- If unset, no telemetry export is attempted.
- Gate execution remains deterministic even when OTel endpoint is unavailable (best-effort dispatch).
- Rotation is opt-in; without `PUMUKI_TELEMETRY_JSONL_MAX_BYTES`, append behavior remains unchanged.

Quick verification (JSONL):

```bash
PUMUKI_TELEMETRY_JSONL_PATH=.pumuki/artifacts/gate-telemetry.jsonl \
  npx --yes --package pumuki@latest pumuki-pre-commit
```

Expected JSONL keys for enterprise audit ingestion:

- `schema=telemetry_event_v1` with `schema_version=1.0`
- `stage`, `gate_outcome`, `severity_counts`
- `policy.bundle`, `policy.hash`, `policy.version`, `policy.signature`, `policy.policy_source`
- `policy.validation_status`, `policy.validation_code` (when policy-as-code validation is available; status can be `valid|invalid|expired|unknown-source|unsigned`)

## Heuristic pilot flag

Enable semantic heuristic rules:

```bash
PUMUKI_ENABLE_AST_HEURISTICS=true
```

When enabled, stage-based heuristic severity maturity applies via `applyHeuristicSeverityForStage`.

## AST Intelligence dual mode (legacy + nodos)

Controla la validación dual entre findings legacy y evaluación AST por nodos compilados desde `skills-ir`.

```bash
PUMUKI_AST_INTELLIGENCE_DUAL_MODE=off|shadow|strict
```

- `off` (default): desactivado.
- `shadow`: compara y reporta divergencias sin bloquear.
- `strict`: bloquea si hay divergencias (`false_positive/false_negative`) entre legacy y AST.

## Rule packs

Version map lives in `core/rules/presets/rulePackVersions.ts`.

Documentation:

- `docs/rule-packs/README.md`
- `docs/rule-packs/ios.md`
- `docs/rule-packs/backend.md`
- `docs/rule-packs/frontend.md`
- `docs/rule-packs/android.md`
- `docs/rule-packs/heuristics.md`

## Evidence contract

Configuration outcomes are reflected in `.ai_evidence.json`:

- active `platforms`
- loaded `rulesets`
- `snapshot` outcome
- `ledger` continuity

Schema reference: `docs/mcp/ai-evidence-v2.1-contract.md`.

## AI Gate skills contract

`evaluateAiGate` now emits a machine-readable contract snapshot under `skills_contract`.

Contract goals:

- deterministic mapping: `detected platform -> required skills policy/rules`
- explicit coverage checks for `active_rule_ids` and `evaluated_rule_ids`
- stage-aware enforcement beyond PRE_WRITE (`PRE_COMMIT`, `PRE_PUSH`, `CI`)

Runtime fields:

- `skills_contract.stage`
- `skills_contract.status` (`PASS|FAIL|NOT_APPLICABLE`)
- `skills_contract.detected_platforms`
- `skills_contract.requirements[]`
- `skills_contract.violations[]`

Blocking code:

- `EVIDENCE_SKILLS_CONTRACT_INCOMPLETE` (when contract is incomplete outside PRE_WRITE)

## Worktree hygiene guard (PRE_WRITE + Git hooks)

AI Gate enforces worktree hygiene using **pending_changes** (or `staged + unstaged`) to reduce oversized batches before commit/push. The same thresholds apply to **`PRE_WRITE`**, **`PRE_COMMIT`**, **`PRE_PUSH`**, and **`CI`** when `.ai_evidence.json` is readable and valid (hooks merge these violations into `runPlatformGate`). Git-flow protected-branch checks (`GITFLOW_PROTECTED_BRANCH`) are also merged into hook runs.

Environment variables:

- `PUMUKI_PREWRITE_WORKTREE_HYGIENE_ENABLED` (`true|false`, default: `true`)
- `PUMUKI_PREWRITE_WORKTREE_WARN_THRESHOLD` (default: `12`)
- `PUMUKI_PREWRITE_WORKTREE_BLOCK_THRESHOLD` (default: `24`)

## Evidencia en PRE_PUSH con `.ai_evidence.json` trackeado

- `PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE` (`1|true|yes`): fuerza la escritura del snapshot en `PRE_PUSH` aunque `.ai_evidence.json` esté versionado. Por defecto (sin esta variable), si el fichero está en el índice de git y el outcome no es `BLOCK`, Pumuki **no** muta el archivo para no romper hooks encadenados (p. ej. `pre-commit` ejecutado desde `pre-push`).

Codes emitted:

- `EVIDENCE_PREWRITE_WORKTREE_WARN` (warning, still `ALLOWED`)
- `EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT` (blocking error)

## TDD/BDD Vertical Enforcement Contract

For new/complex changes, Pumuki enforces a neutral TDD/BDD evidence contract.

Default evidence path:

- `.pumuki/artifacts/pumuki-evidence-v1.json`

Optional overrides:

- `PUMUKI_TDD_BDD_EVIDENCE_PATH`
- `PUMUKI_TDD_BDD_WAIVER_PATH`
- `PUMUKI_TDD_COMPLEX_MAX_FILES` (default: `5`)
- `PUMUKI_TDD_COMPLEX_MAX_LOC` (default: `120`)

Waiver contract (optional, incident-only):

- `.pumuki/waivers/tdd-bdd.json`
- Requires one explicit approver, reason, and non-expired `expires_at`.

## SaaS Ingestion Contract (No-MVP)

Optional payload path override for local validation of SaaS ingestion contract `v1`:

- `PUMUKI_SAAS_INGESTION_PAYLOAD_PATH`

Default path when unset:

- `.pumuki/artifacts/hotspots-saas-ingestion-v1.json`

Optional audit and metrics paths for publication diagnostics:

- `PUMUKI_SAAS_INGESTION_AUDIT_PATH`
- `PUMUKI_SAAS_INGESTION_METRICS_PATH`

Default paths when unset:

- `.pumuki/artifacts/saas-ingestion-audit.ndjson`
- `.pumuki/artifacts/saas-ingestion-metrics.json`

Rollback to local-only defaults:

- Remove these overrides from environment to return to repo-local defaults.
- If needed, remove local artifacts under `.pumuki/artifacts/` to reset diagnostics state.

Supported versions:

- Canonical write: `1`
- Backward-compatible read: `1`, `1.0`
