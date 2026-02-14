# Skills Migration Guide: Personal to Repository-Enforced

## Purpose

This guide describes how to move from personal, machine-local skills usage to deterministic repository-enforced skills in Pumuki.

Target state:

- the team evaluates the same `skills.lock.json` and `skills.policy.json`
- CI reproduces local gate behavior
- evidence traces active skills bundles in `.ai_evidence.json`

## Scope and Constraints

- Runtime gate enforcement must not depend on `~/.codex/**`.
- Repository contracts are the source of truth for enforcement.
- Skills remain additive to baseline + project rules (no core coupling).

## Migration Checklist

1. Define repository skill sources in `skills.sources.json`.
2. Compile and commit lock contract:
   - `npm run skills:compile`
3. Validate lock freshness:
   - `npm run skills:lock:check`
4. Define stage policies and bundle toggles in `skills.policy.json`.
5. Run local stage gates (`PRE_COMMIT`, `PRE_PUSH`, `CI`) and inspect `.ai_evidence.json`:
   - confirm `rulesets[]` includes active skills bundles and policy trace.
6. Open PR and ensure CI passes `Skills Lock Freshness`.

## Recommended Rollout

1. Soft rollout:
   - keep strict block thresholds unchanged
   - enable skills bundles with warn-first calibration where appropriate
2. Calibration:
   - promote selected rules in `skills.policy.json` for `PRE_PUSH/CI`
3. Hardening:
   - require lock freshness in CI (already enforced in `.github/workflows/ci.yml`)
   - reject stale lock updates in PR review

## Team Operating Model

- Owners:
  - platform leads curate skills templates and policy behavior
  - release/quality owners approve lock updates
- Update flow:
  1. edit sources/policy
  2. recompile lock
  3. run lock check + stage tests
  4. commit contracts and rationale in PR

## Failure Modes and Recovery

- Symptom: CI fails with stale lock.
  - Action: re-run `npm run skills:compile`, commit updated `skills.lock.json`, re-run checks.
- Symptom: local gate differs from CI.
  - Action: verify committed `skills.policy.json`, branch refs used by stage runners, and evidence trace in `rulesets[]`.
- Symptom: unexpected skills violations.
  - Action: verify bundle enablement in `skills.policy.json` and compiled mapping entries in `skills.lock.json`.

## Verification Criteria

Migration is complete when all conditions hold:

- contracts are committed and validated
- CI lock freshness check is green
- stage outcomes are deterministic across local/CI
- evidence includes active skills bundles and policy trace for each stage

Execution runbook for consumer-repository rollout validation:

- `docs/validation/skills-rollout-consumer-repositories.md`
