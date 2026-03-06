# Detection Audit Baseline

Official baseline for running and comparing enterprise detection quality in this repository.

This document replaces ad-hoc cycle and forensic markdown reports that were previously stored in `docs/` root.

## Scope

- Full repository audit using menu option `1` (`PRE_COMMIT`, `audit_mode=engine`).
- Legacy vs enterprise dominance comparison from two evidence inputs.
- Deterministic output artifacts written outside versioned docs.

## Full Repo Audit (Official Procedure)

Run interactive consumer audit option `1`:

```bash
printf '1\n10\n' | node bin/pumuki-framework.js
```

Validate canonical evidence fields:

```bash
node --input-type=module - <<'NODE'
import { readFileSync } from 'node:fs';
const evidence = JSON.parse(readFileSync('.ai_evidence.json', 'utf8'));
console.log(JSON.stringify({
  stage: evidence.snapshot?.stage,
  audit_mode: evidence.snapshot?.audit_mode,
  outcome: evidence.snapshot?.outcome,
  total_violations: evidence.severity_metrics?.total_violations,
  by_enterprise_severity: evidence.severity_metrics?.by_enterprise_severity,
  rules_coverage: evidence.snapshot?.rules_coverage,
}, null, 2));
NODE
```

## Legacy vs Enterprise Dominance

Generate parity report:

```bash
node --import tsx scripts/build-legacy-parity-report.ts \
  --legacy <legacy-evidence.json> \
  --enterprise .ai_evidence.json \
  --out .audit-reports/legacy-parity-report.md
```

Notes:

- Default output is `.audit-reports/legacy-parity-report.md`.
- `.audit-reports/` is local runtime output and must not be committed.

## Quality Gate Expectations

- `rules_coverage.counts.unevaluated = 0`
- `rules_coverage.coverage_ratio = 1`
- `rules_coverage.counts.unsupported_auto = 0` (when present)

If those conditions are not met, the gate must block by governance findings.
