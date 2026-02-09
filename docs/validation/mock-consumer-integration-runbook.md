# Mock Consumer Integration Runbook

Use this runbook to validate framework integration behavior in a dedicated mock consumer repository before running any enterprise-consumer diagnostics.

Policy anchor: `docs/validation/enterprise-consumer-isolation-policy.md`.

## Goal

Validate packaging and runtime behavior (`PRE_COMMIT`, `PRE_PUSH`, `CI`) without touching enterprise consumer repositories.

## Preconditions

- Framework repository up to date on the active working branch.
- Dependencies installed in framework workspace (`npm ci`).
- Local mock consumer repository available (for example: `pumuki-mock-consumer`).

## Path A: Deterministic package smoke (recommended baseline)

Run both smoke modes from framework workspace:

```bash
npm run validation:package-smoke
npm run validation:package-smoke:minimal
```

Expected outcomes:

- `block` mode: stage commands exit `1` with `snapshot.outcome=BLOCK`.
- `minimal` mode: stage commands exit `0` with `snapshot.outcome=PASS`.

Artifacts:

- `.audit-reports/package-smoke/block/summary.md`
- `.audit-reports/package-smoke/minimal/summary.md`

## Path B: Manual local integration in mock consumer

1. Pack framework from current branch:

```bash
npm pack
```

2. Install tarball in mock consumer:

```bash
npm install /absolute/path/to/pumuki-ast-hooks-<version>.tgz
```

3. Execute stage wrappers from mock consumer:

```bash
npx tsx integrations/git/preCommitIOS.cli.ts
npx tsx integrations/git/prePushBackend.cli.ts
npx tsx integrations/git/ciFrontend.cli.ts
```

4. Inspect deterministic evidence:

```bash
jq -r '.version' .ai_evidence.json
jq -r '.snapshot.stage' .ai_evidence.json
jq -r '.snapshot.outcome' .ai_evidence.json
```

## A/B Checklist

- [ ] Same input repo state yields stable evidence semantics (`snapshot/findings/platforms/rulesets`).
- [ ] `block` and `minimal` smoke modes behave as expected.
- [ ] No enterprise consumer repository was modified during this validation.

## Exit Criteria

- Smoke summaries show `Status: PASS` for both modes.
- Mock consumer evidence is `version: "2.1"`.
- Any enterprise-consumer follow-up is documented as external diagnostics/remediation, not applied from framework workspace.
