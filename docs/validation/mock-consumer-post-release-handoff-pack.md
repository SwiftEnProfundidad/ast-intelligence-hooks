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

## Next-Round Task 1 Output (dirty baseline guardrail)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `5f8c06b`
- change: preflight guard added to matrix runner to fail-fast when source repo baseline is dirty (before clone/scenario execution).

Validation evidence:
- dirty baseline run:
  - command: `npm run pumuki:matrix`
  - exit: `17`
  - message:
    - `ERROR: source repository baseline is dirty; matrix runner requires a clean baseline.`
    - actionable guidance includes `git -C "<repo>" status --short --branch` and cleanup instruction.
- clean baseline run (after commit):
  - command: `npm run pumuki:matrix`
  - result:
    - `clean`: `0/0/0`
    - `violations`: `1/1/1`
    - `mixed`: `1/1/1`
    - final line: `All scenario matrix checks passed for package: pumuki@latest`

Conclusion:
- fail-fast operator safety guard is active and deterministic.
- clean-baseline deterministic contract is preserved.

## Next-Round Task 2 Output (deterministic matrix summary artifact)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `24dd39a`
- change: matrix runner now writes `artifacts/pumuki-matrix-summary.json` after successful runs.

Validation evidence:
- command: `npm run pumuki:matrix`
- console contract preserved:
  - `clean`: `pre-commit=0 pre-push=0 ci=0`
  - `violations`: `pre-commit=1 pre-push=1 ci=1`
  - `mixed`: `pre-commit=1 pre-push=1 ci=1`
  - final line unchanged: `All scenario matrix checks passed for package: pumuki@latest`
- artifact output:
  - path: `artifacts/pumuki-matrix-summary.json`
  - sample contract (`jq`):
    - `package_spec="pumuki@latest"`
    - `final_verdict="PASS"`
    - `generated_at_utc` present
    - `scenarios.clean|violations|mixed` include `pre_commit_exit`, `pre_push_exit`, `ci_exit`
  - assertion check: `summary_contract=PASS`

Conclusion:
- deterministic summary artifact is produced and parseable.
- existing matrix stage-exit behavior and console output contract remain stable.

## Next-Round Task 3 Output (no stale summary on failed runs)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `9b49a6e`
- change: runner now deletes `artifacts/pumuki-matrix-summary.json` at run start and on non-zero exit, preventing stale `PASS` artifacts after failures.

Validation evidence (`fail -> pass -> fail`):
- `A_exit=17 A_summary_exists=0`
- `B_summary_exists=1 B_verdict=PASS`
- `C_exit=17 C_summary_exists=0`

Conclusion:
- failed runs no longer leave stale-success summary artifacts.
- successful runs keep generating a valid parseable `PASS` summary with unchanged console contract.

## Next-Round Task 4 Output (deterministic last-failure artifact)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `d3427c7`
- change: runner now writes `artifacts/pumuki-matrix-last-failure.json` on non-zero exit (`final_verdict=FAIL`, `exit_code`, `failure_phase`) and removes stale failure artifact on successful runs.

Validation evidence (`fail -> pass -> fail`):
- `A_exit=17 A_summary_exists=0 A_failure_exists=1 A_failure={"final_verdict":"FAIL","exit_code":17,"failure_phase":"preflight","package_spec":"pumuki@latest"}`
- `B_summary_exists=1 B_failure_exists=0 B_summary={"final_verdict":"PASS","package_spec":"pumuki@latest"}`
- `C_exit=17 C_summary_exists=0 C_failure_exists=1 C_failure={"final_verdict":"FAIL","exit_code":17,"failure_phase":"preflight","package_spec":"pumuki@latest"}`

Conclusion:
- failed runs now leave deterministic machine-readable failure state.
- successful runs clear stale failure state while preserving current PASS summary behavior and console contract.

## Next-Round Task 5 Output (failure context metadata)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `5af7ded`
- change: `pumuki-matrix-last-failure.json` now includes deterministic `failure_step` and `failure_log_path`, with scenario-aware failure context after preflight.

Validation evidence:
- dirty preflight failure:
  - `dirty_exit=17`
  - `dirty_failure={"final_verdict":"FAIL","exit_code":17,"failure_phase":"preflight","failure_step":"source_repo_cleanliness","failure_log_path":null,"package_spec":"pumuki@latest"}`
- successful matrix run:
  - `pass_summary_exists=1`
  - `pass_failure_exists=0`
  - `pass_summary={"final_verdict":"PASS","package_spec":"pumuki@latest"}`
- forced scenario failure after preflight (invalid package):
  - `scenario_exit=1`
  - `scenario_failure={"final_verdict":"FAIL","exit_code":1,"failure_phase":"clean","failure_step":"npm_install_package","failure_log_path":"/tmp/pumuki-clean-npm-install.log","package_spec":"pumuki@0.0.0-not-a-real-version"}`
  - `scenario_log_exists=1`
  - `summary_exists_after_scenario_fail=0`

Conclusion:
- failure metadata now supports deterministic step-level and scenario-aware triage context.
- backward-compatible fields remain intact while console/summary contracts stay stable.

## Next-Round Task 6 Output (run-id correlation across artifacts)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `a9d9b29`
- change: artifacts now include shared per-execution `run_id`:
  - `pumuki-matrix-summary.json.run_id`
  - `pumuki-matrix-last-failure.json.run_id`

Validation evidence:
- dirty preflight failure:
  - `preflight_exit=17`
  - `preflight={"final_verdict":"FAIL","exit_code":17,"failure_phase":"preflight","run_id":"pumuki-matrix-20260218T193834Z-45255"}`
- successful matrix run:
  - `pass_summary={"final_verdict":"PASS","package_spec":"pumuki@latest","run_id":"pumuki-matrix-20260218T193834Z-45291"}`
  - `pass_failure_exists=0`
  - `pass_last_line=All scenario matrix checks passed for package: pumuki@latest`
- forced scenario failure after preflight (invalid package):
  - `scenario_exit=1`
  - `scenario={"final_verdict":"FAIL","exit_code":1,"failure_phase":"clean","failure_step":"npm_install_package","run_id":"pumuki-matrix-20260218T193910Z-51028"}`
  - `summary_exists_after_scenario_fail=0`
- run-id checks:
  - `preflight_non_empty=yes`
  - `summary_non_empty=yes`
  - `scenario_non_empty=yes`
  - `scenario_stable=yes`

Conclusion:
- both success and failure artifacts now carry deterministic non-empty `run_id`.
- compatibility and console contract remain unchanged.

## Next-Round Task 7 Output (portable failure log artifact)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `a4fb8e8`
- change: when a failure has an internal log, runner now copies it into `artifacts/pumuki-matrix-last-failure.log` and exposes path via `failure_log_artifact` in `pumuki-matrix-last-failure.json`.

Validation evidence:
- preflight dirty failure:
  - `preflight_exit=17`
  - `preflight={"final_verdict":"FAIL","exit_code":17,"failure_phase":"preflight","failure_step":"source_repo_cleanliness","failure_log_artifact":null,"run_id":"pumuki-matrix-..."}`
- scenario failure after preflight (invalid package):
  - `scenario_exit=1`
  - `scenario={"final_verdict":"FAIL","exit_code":1,"failure_phase":"clean","failure_step":"npm_install_package","failure_log_artifact":"/Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer/artifacts/pumuki-matrix-last-failure.log","run_id":"pumuki-matrix-..."}`
  - `scenario_log_artifact_exists=1`
- successful run after failure:
  - `pass_summary_exists=1`
  - `pass_failure_json_exists=0`
  - `pass_failure_log_artifact_exists=0`
  - `pass_last_line=All scenario matrix checks passed for package: pumuki@latest`

Conclusion:
- failure triage now includes a portable artifact-local log reference.
- successful runs continue to clean stale failure state and preserve console contract.

## Next-Round Task 8 Output (failure log integrity metadata)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `ecf4e9c`
- change: `pumuki-matrix-last-failure.json` now includes:
  - `failure_log_artifact_sha256`
  - `failure_log_artifact_bytes`
  when a copied failure log artifact exists.

Validation evidence:
- preflight dirty failure:
  - `preflight_exit=17`
  - `preflight={"exit_code":17,"failure_phase":"preflight","failure_step":"source_repo_cleanliness","failure_log_artifact":null,"failure_log_artifact_sha256":null,"failure_log_artifact_bytes":null}`
- scenario failure after preflight (invalid package):
  - `scenario_exit=1`
  - `scenario={"exit_code":1,"failure_phase":"clean","failure_step":"npm_install_package","failure_log_artifact":"/.../artifacts/pumuki-matrix-last-failure.log","failure_log_artifact_sha256":"6104e2d84cf61e7deb6522aa6ea6bef2eb90d6352eed8b35feda185fa745d896","failure_log_artifact_bytes":378}`
  - `scenario_checks={"artifact_exists":true,"sha256_non_empty":true,"bytes_positive":true}`
- successful run after failure:
  - `success_last_line=All scenario matrix checks passed for package: pumuki@latest`
  - `summary_check={"final_verdict":"PASS","run_id":"pumuki-matrix-..."}`
  - `failure_json_exists_after_success=0`
  - `failure_log_exists_after_success=0`

Conclusion:
- failure-log artifacts now carry deterministic integrity metadata (hash + size) for portable triage verification.
- compatibility and console contract remain unchanged.

## Next-Round Task 9 Output (failure command metadata)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `eec64fd`
- change: `pumuki-matrix-last-failure.json` now includes `failure_command`, resolved deterministically from `failure_step`.

Validation evidence:
- preflight dirty failure:
  - `preflight_exit=17`
  - `preflight={"exit_code":17,"failure_phase":"preflight","failure_step":"source_repo_cleanliness","failure_command":"git -C \".../pumuki-mock-consumer\" status --porcelain --untracked-files=normal"}`
  - `preflight_cmd_non_empty=yes`
- scenario failure after preflight (invalid package):
  - `scenario_exit=1`
  - `scenario={"exit_code":1,"failure_phase":"clean","failure_step":"npm_install_package","failure_command":"npm install --save-exact \"pumuki@0.0.0-not-a-real-version\""}`
  - `scenario_cmd_check=yes`
- successful run after failure:
  - `success_last_line=All scenario matrix checks passed for package: pumuki@latest`
  - `summary_json={"final_verdict":"PASS","run_id":"pumuki-matrix-..."}`
  - `failure_json_exists_after_success=0`
  - `failure_log_exists_after_success=0`

Conclusion:
- each failure report now carries the exact canonical command behind the failing step, improving deterministic triage.
- compatibility and console contract remain unchanged.

## Next-Round Task 10 Output (portable command template metadata)

Execution date: `2026-02-18`  
Target: `pumuki-mock-consumer/scripts/run-pumuki-matrix.sh`

Implementation:
- commit: `ab9f616`
- change: `pumuki-matrix-last-failure.json` now includes:
  - `failure_command_template` (portable template with placeholders),
  - `failure_command_variables` (resolved values for template placeholders),
  while preserving existing `failure_command`.

Validation evidence:
- preflight dirty failure:
  - `preflight_exit=17`
  - `preflight_json={"exit_code":17,"failure_phase":"preflight","failure_step":"source_repo_cleanliness","failure_command_template":"git -C \"{repo_root}\" status --porcelain --untracked-files=normal","failure_command_variables":{"repo_root":"...","clone_dir":"...","scenario":null,"package_spec":"pumuki@latest","base_ref":null}}`
  - `preflight_template_non_empty=true`
  - `preflight_template_has_placeholder=true`
  - `preflight_template_has_users=false`
- scenario failure after preflight (invalid package):
  - `scenario_exit=1`
  - `scenario_json={"exit_code":1,"failure_phase":"clean","failure_step":"npm_install_package","failure_command":"npm install --save-exact \"pumuki@0.0.0-not-a-real-version\"","failure_command_template":"npm install --save-exact \"{package_spec}\"","failure_command_variables":{"repo_root":"...","clone_dir":"...","scenario":"clean","package_spec":"pumuki@0.0.0-not-a-real-version","base_ref":"upstream-clean"}}`
  - `scenario_template=npm install --save-exact "{package_spec}"`
  - `scenario_var_package=pumuki@0.0.0-not-a-real-version`
  - `scenario_command_present=true`
- successful run after failure:
  - `success_last_line=All scenario matrix checks passed for package: pumuki@latest`
  - `summary_json={"final_verdict":"PASS","run_id":"pumuki-matrix-..."}`
  - `failure_json_exists_after_success=0`
  - `failure_log_exists_after_success=0`

Conclusion:
- failure reports now include machine-portable command templates plus resolved variables, without breaking existing command metadata or console contract.

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
