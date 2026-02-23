# Post-Merge Detection Audit Report

Informe consolidado oficial posterior al merge del ciclo de recuperación enterprise.

## Contexto
- Branch auditada: `develop`
- Stage: `PRE_COMMIT`
- Audit mode: `engine`
- Outcome: `BLOCK`
- Files scanned: `981`
- Files affected: `64`
- Total violations: `83`
- Generated at: `2026-02-23T12:48:48.275Z`

## Resumen por severidad (canónica)
- `CRITICAL`: `42`
- `HIGH`: `37`
- `MEDIUM`: `4`
- `LOW`: `0`

## Top reglas (por volumen)
| Regla | Total | C | H | M | L |
| --- | ---: | ---: | ---: | ---: | ---: |
| `common.types.undefined_in_base_type` | 33 | 33 | 0 | 0 | 0 |
| `common.types.record_unknown_requires_type` | 26 | 0 | 26 | 0 | 0 |
| `common.error.empty_catch` | 4 | 4 | 0 | 0 | 0 |
| `common.types.unknown_without_guard` | 4 | 0 | 0 | 4 | 0 |
| `skills.backend.no-empty-catch` | 4 | 4 | 0 | 0 | 0 |
| `skills.frontend.no-empty-catch` | 4 | 0 | 4 | 0 | 0 |
| `heuristics.ts.child-process-exec-file-sync.ast` | 1 | 0 | 1 | 0 | 0 |
| `heuristics.ts.child-process-exec-file-untrusted-args.ast` | 1 | 0 | 1 | 0 | 0 |
| `heuristics.ts.child-process-exec.ast` | 1 | 0 | 1 | 0 | 0 |
| `heuristics.ts.dynamic-shell-invocation.ast` | 1 | 0 | 1 | 0 | 0 |
| `heuristics.ts.process-exit.ast` | 1 | 0 | 1 | 0 | 0 |
| `sdd.policy.blocked` | 1 | 0 | 1 | 0 | 0 |
| `workflow.bdd.insufficient_features` | 1 | 0 | 1 | 0 | 0 |
| `workflow.bdd.missing_feature_files` | 1 | 1 | 0 | 0 | 0 |

## Top ficheros (por volumen, clicables)
| Fichero | Total | C | H | M | L | Enlace |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `scripts/framework-menu-matrix-canary-lib.ts` | 5 | 2 | 3 | 0 | 0 | [scripts/framework-menu-matrix-canary-lib.ts:54](../../scripts/framework-menu-matrix-canary-lib.ts#L54) |
| `integrations/lifecycle/gitService.ts` | 4 | 3 | 1 | 0 | 0 | [integrations/lifecycle/gitService.ts:25](../../integrations/lifecycle/gitService.ts#L25) |
| `core/facts/extractHeuristicFacts.ts` | 3 | 0 | 3 | 0 | 0 | [core/facts/extractHeuristicFacts.ts:3](../../core/facts/extractHeuristicFacts.ts#L3) |
| `integrations/config/skillsCustomRules.ts` | 3 | 1 | 1 | 1 | 0 | [integrations/config/skillsCustomRules.ts:3](../../integrations/config/skillsCustomRules.ts#L3) |
| `integrations/lifecycle/update.ts` | 3 | 2 | 1 | 0 | 0 | [integrations/lifecycle/update.ts:54](../../integrations/lifecycle/update.ts#L54) |
| `integrations/mcp/enterpriseServer.ts` | 3 | 1 | 1 | 1 | 0 | [integrations/mcp/enterpriseServer.ts:3](../../integrations/mcp/enterpriseServer.ts#L3) |
| `scripts/adapter-session-status-writes-log-filter-lib.ts` | 3 | 2 | 1 | 0 | 0 | [scripts/adapter-session-status-writes-log-filter-lib.ts:54](../../scripts/adapter-session-status-writes-log-filter-lib.ts#L54) |
| `core/facts/detectors/typescript/index.ts` | 2 | 1 | 1 | 0 | 0 | [core/facts/detectors/typescript/index.ts:3](../../core/facts/detectors/typescript/index.ts#L3) |
| `PROJECT_ROOT` | 2 | 1 | 1 | 0 | 0 | [PROJECT_ROOT](../../PROJECT_ROOT#L1) |
| `core/facts/detectors/browser/index.ts` | 1 | 0 | 1 | 0 | 0 | [core/facts/detectors/browser/index.ts:3](../../core/facts/detectors/browser/index.ts#L3) |
| `core/facts/detectors/process/core.ts` | 1 | 0 | 1 | 0 | 0 | [core/facts/detectors/process/core.ts:3](../../core/facts/detectors/process/core.ts#L3) |
| `core/facts/detectors/process/shell.ts` | 1 | 0 | 1 | 0 | 0 | [core/facts/detectors/process/shell.ts:3](../../core/facts/detectors/process/shell.ts#L3) |
| `core/facts/detectors/process/spawn.ts` | 1 | 0 | 1 | 0 | 0 | [core/facts/detectors/process/spawn.ts:3](../../core/facts/detectors/process/spawn.ts#L3) |
| `core/facts/detectors/security/securityCredentials.ts` | 1 | 0 | 1 | 0 | 0 | [core/facts/detectors/security/securityCredentials.ts:3](../../core/facts/detectors/security/securityCredentials.ts#L3) |
| `core/facts/detectors/security/securityCrypto.ts` | 1 | 0 | 1 | 0 | 0 | [core/facts/detectors/security/securityCrypto.ts:3](../../core/facts/detectors/security/securityCrypto.ts#L3) |

## Cobertura de reglas
- active: `417`
- evaluated: `417`
- unevaluated: `0`
- coverage_ratio: `1`

## Evidencias fuente
- `.ai_evidence.json`
- `.audit_tmp/p-adhoc-lines-008-menu.out`
- `.audit-reports/p-adhoc-lines-008-full-repo-audit.md`
- `.audit-reports/pumuki-legacy-audit.md`
