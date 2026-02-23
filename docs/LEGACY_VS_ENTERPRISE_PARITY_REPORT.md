# Legacy Parity Dominance Report

- baseline_source_legacy_log: `assets/readme/forensics-violations/20260223-025640/legacy-ast.log`
- baseline_source_enterprise_log: `assets/readme/forensics-violations/20260223-025640/refactor-option1.log`
- normalization_note: `legacy-parity-input.json` y `enterprise-parity-input.json` contienen la proyección normalizada de severidades del baseline para comparación determinista.

- generated_at: 2026-02-23T03:11:39.231Z
- legacy_path: /Users/juancarlosmerlosalbarracin/Developer/Projects/ast-intelligence-hooks/assets/readme/forensics-violations/20260223-025640/legacy-parity-input.json
- enterprise_path: /Users/juancarlosmerlosalbarracin/Developer/Projects/ast-intelligence-hooks/assets/readme/forensics-violations/20260223-025640/enterprise-parity-input.json
- dominance: FAIL
- rule_dominance: FAIL
- hard_block_by_severity: YES

## Scope Validation

- strict_scope: ENABLED
- stage_match: YES
- files_scanned_match: YES
- repo_root_match: YES
- legacy_stage: PRE_COMMIT
- enterprise_stage: PRE_COMMIT
- legacy_files_scanned: 978
- enterprise_files_scanned: 978
- legacy_repo_root: /Users/juancarlosmerlosalbarracin/Developer/Projects/ast-intelligence-hooks
- enterprise_repo_root: /Users/juancarlosmerlosalbarracin/Developer/Projects/ast-intelligence-hooks

## Severity Matrix

| severity | legacy | enterprise | dominance |
|---|---:|---:|---|
| CRITICAL | 9 | 4 | FAIL |
| HIGH | 41 | 8 | FAIL |
| MEDIUM | 21 | 0 | FAIL |
| LOW | 0 | 0 | PASS |

## Totals

- compared_rules: 3
- passed_rules: 0
- failed_rules: 3
- legacy_findings: 71
- enterprise_findings: 12

## Rule Matrix

| platform | rule_id | legacy | enterprise | dominance |
|---|---|---:|---:|---|
| backend | baseline.critical | 9 | 4 | FAIL |
| backend | baseline.medium | 21 | 0 | FAIL |
| frontend | baseline.high | 41 | 8 | FAIL |
