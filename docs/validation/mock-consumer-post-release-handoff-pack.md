# Mock Consumer Post-Release Handoff Pack

This runbook captures the operational hand-off package for the normalized mock baseline used after the `pumuki@6.3.14` release hardening cycle.

## Scope

- Target repository: `pumuki-mock-consumer`
- Goal: run deterministic validation rounds without baseline drift.
- Outcome contract:
  - matrix checks deterministic (`clean=0/0/0`, `violations=1/1/1`, `mixed=1/1/1`)
  - stage evidence contract stable (`PRE_COMMIT`, `PRE_PUSH`, `CI`)

## Baseline References

Mock branch `feat/pumuki-validation` includes the key hardening commits:

- `0521546`: matrix opens/closes SDD session per scenario
- `b82b4cb`: normalized baseline (apps + rules + package files)
- `33c6614`: clean scenario includes backend domain test artifact
- `4cdb11e`: clean scenario includes backend spec artifact (`.ts`) for BDD coupling
- `2023e34`: matrix runner seeds clean baseline before each scenario

## Reproducible Commands

### 1) Deterministic Matrix Validation

```bash
cd /Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer
npm install --save-exact pumuki@6.3.14
npm run pumuki:matrix
```

Expected result:

- `scenario:clean` => `pre-commit=0 pre-push=0 ci=0`
- `scenario:violations` => `pre-commit=1 pre-push=1 ci=1`
- `scenario:mixed` => `pre-commit=1 pre-push=1 ci=1`
- final line: `All scenario matrix checks passed for package: pumuki@latest`

### 2) Stage/Evidence Contract Validation (Violations Path)

Use a temp clone to avoid mutating the working baseline:

```bash
TMP_DIR="$(mktemp -d /tmp/pumuki-stage-evidence-XXXXXX)"
git clone /Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer "$TMP_DIR/repo"
cd "$TMP_DIR/repo"

npm run pumuki:matrix
npm install --save-exact pumuki@6.3.14
npx pumuki install
npx openspec new change stage-evidence --description "stage evidence validation"
npx pumuki sdd session --open --change=stage-evidence

# deterministic seed
npm run scenario:clean
git add apps
git commit --no-verify -m "tmp: stage evidence clean seed" || true
git branch -f upstream-stage-evidence HEAD
git branch --set-upstream-to=upstream-stage-evidence

# violations path
npm run scenario:violations
git add apps
npx pumuki-pre-commit; echo "pre_commit_exit=$?"
jq -c '{stage:.snapshot.stage,outcome:.snapshot.outcome,total_findings:(.snapshot.findings|length),rulesets:((.rulesets//[])|map(.bundle)|sort)}' .ai_evidence.json

git commit --no-verify -m "tmp: stage evidence violations" || true
git branch -f upstream-stage-evidence HEAD~1
git branch --set-upstream-to=upstream-stage-evidence

npx pumuki-pre-push; echo "pre_push_exit=$?"
jq -c '{stage:.snapshot.stage,outcome:.snapshot.outcome,total_findings:(.snapshot.findings|length),rulesets:((.rulesets//[])|map(.bundle)|sort)}' .ai_evidence.json

GITHUB_BASE_REF=upstream-stage-evidence npx pumuki-ci; echo "ci_exit=$?"
jq -c '{stage:.snapshot.stage,outcome:.snapshot.outcome,total_findings:(.snapshot.findings|length),rulesets:((.rulesets//[])|map(.bundle)|sort)}' .ai_evidence.json
```

Expected stage contract:

- `pre_commit_exit=1`, `snapshot.stage=PRE_COMMIT`, `snapshot.outcome=BLOCK`
- `pre_push_exit=1`, `snapshot.stage=PRE_PUSH`, `snapshot.outcome=BLOCK`
- `ci_exit=1`, `snapshot.stage=CI`, `snapshot.outcome=BLOCK`

Expected bundles present in summaries:

- `androidRuleSet@1.0.0`
- `backendRuleSet@1.0.0`
- `frontendRuleSet@1.0.0`
- `iosEnterpriseRuleSet@1.0.0`
- `project-rules`
- `gate-policy.default.<stage>`

## Latest Operational Output (real user environment)

Execution date: `2026-02-18`  
Source environment:
- real repo: `/Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer`
- stage/evidence temp clone root: `/tmp/pumuki-stage-evidence-25sqIb`

Observed results:
- matrix:
  - `clean`: `pre-commit=0 pre-push=0 ci=0`
  - `violations`: `pre-commit=1 pre-push=1 ci=1`
  - `mixed`: `pre-commit=1 pre-push=1 ci=1`
  - final line: `All scenario matrix checks passed for package: pumuki@latest`
- stage/evidence violations path:
  - `pre_commit_exit=1` with `{"stage":"PRE_COMMIT","outcome":"BLOCK","total_findings":22,...}`
  - `pre_push_exit=1` with `{"stage":"PRE_PUSH","outcome":"BLOCK","total_findings":39,...}`
  - `ci_exit=1` with `{"stage":"CI","outcome":"BLOCK","total_findings":39,...}`
- bundles confirmed in summaries:
  - `androidRuleSet@1.0.0`
  - `backendRuleSet@1.0.0`
  - `frontendRuleSet@1.0.0`
  - `iosEnterpriseRuleSet@1.0.0`
  - `project-rules`
  - `gate-policy.default.PRE_COMMIT|PRE_PUSH|CI`

## Next-Cycle Execution Output (real user environment)

Execution date: `2026-02-18`  
Source environment:
- real repo: `/Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer`

Observed matrix result:
- `npm run pumuki:matrix` failed in `scenario:clean` before gates:
  - `ERROR: failed to create OpenSpec change for scenario 'clean'.`
  - `npm error could not determine executable to run`
- root cause (reproduced):
  - matrix internal clone installs only `pumuki` (`npm install --save-exact pumuki@...`)
  - `@fission-ai/openspec` is not installed in that clone
  - `npx openspec` cannot resolve local bin and falls back to package `openspec` (no executable contract for this flow)

Stage/evidence fallback validation (manual temp clone with explicit OpenSpec preinstall):
- temp repo: `/tmp/pumuki-stage-evidence-next-manual-umLTI6/repo`
- preinstall:
  - `npm install --save-dev --save-exact @fission-ai/openspec@latest`
  - `npm install --save-exact pumuki@6.3.14`
- results:
  - `pre_commit_exit=1` with `PRE_COMMIT/BLOCK/22`
  - `pre_push_exit=1` with `PRE_PUSH/BLOCK/39`
  - `ci_exit=1` with `CI/BLOCK/39`
  - bundle contract check: `{"android":true,"backend":true,"frontend":true,"ios":true,"project_rules":true,"gate_policy":true}`

Operational conclusion:
- Stage/evidence contract remains stable.
- Deterministic matrix is currently blocked by OpenSpec dependency resolution in matrix clone bootstrap.

### Remediation Applied (same cycle)

Fix applied in mock repository:
- repo: `/Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer`
- commit: `8f57767`
- change: `scripts/run-pumuki-matrix.sh` now performs explicit OpenSpec bootstrap in each internal clone stage before opening SDD session.

Post-fix verification:
- command: `npm run pumuki:matrix`
- result:
  - `clean`: `pre-commit=0 pre-push=0 ci=0`
  - `violations`: `pre-commit=1 pre-push=1 ci=1`
  - `mixed`: `pre-commit=1 pre-push=1 ci=1`
  - final line: `All scenario matrix checks passed for package: pumuki@latest`

Updated operational conclusion:
- Stage/evidence contract stable.
- Deterministic matrix recovered without manual OpenSpec workaround.

## Next-Cycle Final Output (baseline normalized)

Execution date: `2026-02-18`  
Source environment:
- real repo: `/Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer`
- temp repo (stage/evidence): `/tmp/pumuki-stage-evidence-next-final-9e7qEM/repo`

Observed matrix result (real repo):
- `clean`: `pre-commit=0 pre-push=0 ci=0`
- `violations`: `pre-commit=1 pre-push=1 ci=1`
- `mixed`: `pre-commit=1 pre-push=1 ci=1`
- final line: `All scenario matrix checks passed for package: pumuki@latest`

Observed stage/evidence contract result (temp repo):
- `pre_commit_exit=1` with `PRE_COMMIT/BLOCK/22`
- `pre_push_exit=1` with `PRE_PUSH/BLOCK/39`
- `ci_exit=1` with `CI/BLOCK/39`
- bundle contract check:
  - `android=true`
  - `backend=true`
  - `frontend=true`
  - `ios=true`
  - `project_rules=true`
  - `gate_policy=true`

Final conclusion for this round:
- Matrix deterministic contract: `PASS`
- Stage/evidence contract: `PASS`
- Baseline drift in real mock repo: `NONE` (`git status` clean)

## Exit Criteria

Validation round is considered closed only when all checks pass:

1. Matrix deterministic output exactly matches expected exits.
2. Stage/evidence summaries expose valid `snapshot.stage` + `snapshot.outcome`.
3. Ruleset bundle list includes platform packs and stage gate policy bundle.
4. No ad-hoc bypass is required for normal matrix execution.

## Known Failure Signatures

- `SDD_SESSION_MISSING` in `clean`:
  - session lifecycle not initialized in runner.
- `methodology.tdd.backend-domain-change-requires-tests` in `clean`:
  - clean scenario missing backend domain test artifact.
- `methodology.bdd.backend-application-change-requires-spec` in `clean`:
  - clean scenario missing backend app spec artifact recognized by diff extensions.
