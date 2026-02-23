# Legacy vs Independent Skills Audit Report

- Date: 2026-02-23T01:43:54.463Z
- Repository: `ast-intelligence-hooks`
- Scope: tracked repository files (`git ls-files`), excluding third-party/vendor folders

## 1) Legacy Audit (real legacy engine, historical implementation)

Execution used:

```bash
NODE_PATH="<repo>/node_modules" node /tmp/ast-intelligence-hooks-legacy/legacy/scripts/hooks-system/infrastructure/ast/ast-intelligence.js
```

- Legacy findings total: **71**
- Severity: CRITICAL=9, HIGH=41, MEDIUM=21, LOW=0
- Evidence artifact: .audit_tmp/ast-summary.json

Top legacy rules:

| rule_id | count |
|---|---|
| common.types.record_unknown_requires_type | 33 |
| common.types.unknown_without_guard | 16 |
| common.error.empty_catch | 7 |
| common.network.missing_error_handling | 6 |
| common.debug.console | 3 |
| workflow.bdd.missing_feature_files | 1 |
| workflow.bdd.insufficient_features | 1 |
| common.quality.todo_fixme | 1 |
| common.types.undefined_in_base_type | 1 |
| common.testing.prefer_spy_over_mock | 1 |
| shell.maintainability.large_script | 1 |

### Legacy forensic note (why SRP/OCP/ISP/Clean can be missed)

- Legacy orchestrator imports `backend/ast-backend.js`, not `backend/ast-backend-clean.js` (where SOLID/Clean analyzers are wired).
- Legacy backend analyzer uses `isRealBackendAppFile` guard (`/apps/backend/`), which bypasses many backend rules in repos that do not follow that layout.
- Historical evidence path inspected: `/tmp/ast-intelligence-hooks-legacy/legacy/scripts/hooks-system/infrastructure/ast/backend/ast-backend.js` and `/tmp/ast-intelligence-hooks-legacy/legacy/scripts/hooks-system/infrastructure/ast/backend/ast-backend-clean.js`.

## 2) Independent Audit (without Pumuki runner/menu)

Method: custom AST/text audit executed directly over repository files (no `npx ast-hooks`, no menu, no stage runner).

- Files scanned (source): **979**
- Implementation files: **649**
- Test files: **336**
- Feature files (.feature): **0**
- Independent findings total: **70**
- Severity: CRITICAL=19, ERROR=1, HIGH=49, MEDIUM=1, LOW=0

Category breakdown:

| category | count |
|---|---|
| SOLID/SRP | 48 |
| God Class | 11 |
| Error Handling | 7 |
| Calidad | 1 |
| BDD | 2 |
| SDD | 1 |

Top independent rules:

| rule_id | count |
|---|---|
| skills.solid.srp.large-file | 48 |
| skills.antipattern.god-file | 11 |
| skills.error.empty-catch | 7 |
| skills.quality.todo-fixme | 1 |
| skills.workflow.bdd.missing-feature-files | 1 |
| skills.workflow.bdd.low-feature-coverage | 1 |
| skills.workflow.sdd.openspec-missing | 1 |

Top affected files (independent):

| file | findings |
|---|---|
| scripts/framework-menu-matrix-canary-lib.ts | 4 |
| scripts/framework-menu-legacy-audit-lib.ts | 3 |
| core/facts/__tests__/extractHeuristicFacts.test.ts | 2 |
| integrations/config/__tests__/skillsRuleSet.test.ts | 2 |
| integrations/config/skillsRuleSet.ts | 2 |
| integrations/evidence/__tests__/buildEvidence.test.ts | 2 |
| integrations/evidence/buildEvidence.ts | 2 |
| integrations/git/__tests__/runPlatformGate.test.ts | 2 |
| integrations/lifecycle/cli.ts | 2 |
| integrations/mcp/__tests__/enterpriseServer.test.ts | 2 |
| integrations/mcp/enterpriseServer.ts | 2 |
| scripts/__tests__/framework-menu-legacy-audit.test.ts | 2 |
| PROJECT_ROOT | 2 |
| core/facts/detectors/security/index.test.ts | 1 |
| core/facts/detectors/typescript/index.test.ts | 1 |
| core/facts/detectors/typescript/index.ts | 1 |
| core/facts/extractHeuristicFacts.ts | 1 |
| core/gate/__tests__/evaluateRules.spec.ts | 1 |
| core/rules/presets/heuristics/fsCallbacksFileOperationsRules.ts | 1 |
| core/rules/presets/heuristics/fsCallbacksMetadataRules.ts | 1 |
| core/rules/presets/heuristics/fsSyncDescriptorRules.ts | 1 |
| core/rules/presets/heuristics/fsSyncFileOperationsRules.ts | 1 |
| core/rules/presets/heuristics/typescript.ts | 1 |
| integrations/config/skillsCompilerTemplates.ts | 1 |
| integrations/config/skillsCustomRules.ts | 1 |
| integrations/config/skillsMarkdownRules.ts | 1 |
| integrations/evidence/schema.test.ts | 1 |
| integrations/evidence/writeEvidence.test.ts | 1 |
| integrations/evidence/writeEvidence.ts | 1 |
| integrations/gate/__tests__/stagePolicies-config-and-severity.test.ts | 1 |

### SRP / God Class evidence (independent)

- SRP large-file findings (>300 lines): **30** listed below (sample).
- God-file findings (>500 lines): **11** listed below (sample).

SRP sample:

| file | line | severity | message |
|---|---|---|---|
| core/facts/__tests__/extractHeuristicFacts.test.ts | 1 | HIGH | Archivo con 543 líneas (>300), candidato a violación SRP |
| core/facts/detectors/security/index.test.ts | 1 | HIGH | Archivo con 383 líneas (>300), candidato a violación SRP |
| core/facts/detectors/typescript/index.test.ts | 1 | HIGH | Archivo con 400 líneas (>300), candidato a violación SRP |
| core/facts/detectors/typescript/index.ts | 1 | HIGH | Archivo con 478 líneas (>300), candidato a violación SRP |
| core/facts/extractHeuristicFacts.ts | 1 | HIGH | Archivo con 457 líneas (>300), candidato a violación SRP |
| core/gate/__tests__/evaluateRules.spec.ts | 1 | HIGH | Archivo con 450 líneas (>300), candidato a violación SRP |
| core/rules/presets/heuristics/fsCallbacksFileOperationsRules.ts | 1 | HIGH | Archivo con 401 líneas (>300), candidato a violación SRP |
| core/rules/presets/heuristics/fsCallbacksMetadataRules.ts | 1 | HIGH | Archivo con 419 líneas (>300), candidato a violación SRP |
| core/rules/presets/heuristics/fsSyncDescriptorRules.ts | 1 | HIGH | Archivo con 329 líneas (>300), candidato a violación SRP |
| core/rules/presets/heuristics/fsSyncFileOperationsRules.ts | 1 | HIGH | Archivo con 383 líneas (>300), candidato a violación SRP |
| core/rules/presets/heuristics/typescript.ts | 1 | HIGH | Archivo con 352 líneas (>300), candidato a violación SRP |
| integrations/config/__tests__/skillsRuleSet.test.ts | 1 | HIGH | Archivo con 757 líneas (>300), candidato a violación SRP |
| integrations/config/skillsCompilerTemplates.ts | 1 | HIGH | Archivo con 327 líneas (>300), candidato a violación SRP |
| integrations/config/skillsCustomRules.ts | 1 | HIGH | Archivo con 370 líneas (>300), candidato a violación SRP |
| integrations/config/skillsMarkdownRules.ts | 1 | HIGH | Archivo con 349 líneas (>300), candidato a violación SRP |
| integrations/config/skillsRuleSet.ts | 1 | HIGH | Archivo con 541 líneas (>300), candidato a violación SRP |
| integrations/evidence/__tests__/buildEvidence.test.ts | 1 | HIGH | Archivo con 934 líneas (>300), candidato a violación SRP |
| integrations/evidence/buildEvidence.ts | 1 | HIGH | Archivo con 679 líneas (>300), candidato a violación SRP |
| integrations/evidence/schema.test.ts | 1 | HIGH | Archivo con 316 líneas (>300), candidato a violación SRP |
| integrations/evidence/writeEvidence.test.ts | 1 | HIGH | Archivo con 317 líneas (>300), candidato a violación SRP |

God-file sample:

| file | line | severity | message |
|---|---|---|---|
| core/facts/__tests__/extractHeuristicFacts.test.ts | 1 | CRITICAL | Archivo con 543 líneas (>500), candidato a God Class/Module |
| integrations/config/__tests__/skillsRuleSet.test.ts | 1 | CRITICAL | Archivo con 757 líneas (>500), candidato a God Class/Module |
| integrations/config/skillsRuleSet.ts | 1 | CRITICAL | Archivo con 541 líneas (>500), candidato a God Class/Module |
| integrations/evidence/__tests__/buildEvidence.test.ts | 1 | CRITICAL | Archivo con 934 líneas (>500), candidato a God Class/Module |
| integrations/evidence/buildEvidence.ts | 1 | CRITICAL | Archivo con 679 líneas (>500), candidato a God Class/Module |
| integrations/git/__tests__/runPlatformGate.test.ts | 1 | CRITICAL | Archivo con 970 líneas (>500), candidato a God Class/Module |
| integrations/lifecycle/cli.ts | 1 | CRITICAL | Archivo con 558 líneas (>500), candidato a God Class/Module |
| integrations/mcp/__tests__/enterpriseServer.test.ts | 1 | CRITICAL | Archivo con 688 líneas (>500), candidato a God Class/Module |
| integrations/mcp/enterpriseServer.ts | 1 | CRITICAL | Archivo con 749 líneas (>500), candidato a God Class/Module |
| scripts/__tests__/framework-menu-legacy-audit.test.ts | 1 | CRITICAL | Archivo con 616 líneas (>500), candidato a God Class/Module |
| scripts/framework-menu-legacy-audit-lib.ts | 1 | CRITICAL | Archivo con 1024 líneas (>500), candidato a God Class/Module |

### Error handling / workflow evidence

- Empty catch findings:

| file | line | severity | message |
|---|---|---|---|
| integrations/lifecycle/gitService.ts | 54 | CRITICAL | Bloque catch vacío detectado |
| integrations/lifecycle/update.ts | 84 | CRITICAL | Bloque catch vacío detectado |
| scripts/adapter-session-status-writes-log-filter-lib.ts | 21 | CRITICAL | Bloque catch vacío detectado |
| scripts/framework-menu-matrix-canary-lib.ts | 153 | CRITICAL | Bloque catch vacío detectado |
| scripts/framework-menu-matrix-canary-lib.ts | 163 | CRITICAL | Bloque catch vacío detectado |
| scripts/framework-menu-matrix-canary-lib.ts | 236 | CRITICAL | Bloque catch vacío detectado |
| scripts/framework-menu-matrix-canary-lib.ts | 241 | CRITICAL | Bloque catch vacío detectado |

- BDD/TDD/SDD findings:

| rule_id | file | line | severity | message |
|---|---|---|---|---|
| skills.workflow.bdd.missing-feature-files | PROJECT_ROOT | 1 | CRITICAL | No hay archivos .feature para 649 archivos de implementación |
| skills.workflow.bdd.low-feature-coverage | PROJECT_ROOT | 1 | HIGH | Cobertura BDD baja: 0 feature files / 649 archivos implementación |
| skills.workflow.sdd.openspec-missing | openspec/changes | 1 | ERROR | OpenSpec requerido por SDD no detectado |

### OCP / ISP / DIP / Clean Architecture signals (independent run)

- OCP findings: **0**
- ISP findings: **0**
- DIP findings: **0**
- Clean Architecture findings: **0**

Note: this independent pass found strong SRP/GodClass/error/workflow signals. OCP/ISP/DIP/Clean require deeper semantic detectors wired end-to-end for this repository layout.

## 3) Artifacts

- Legacy raw summary: `.audit_tmp/ast-summary.json`
- Independent raw report: `.audit_tmp/independent-skills-audit.json`
- Legacy evidence mirror: `.AI_EVIDENCE.json`
