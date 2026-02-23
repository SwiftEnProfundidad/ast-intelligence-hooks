# Full Repository Rules Audit Report

Fecha: `2026-02-23`  
Repositorio: `ast-intelligence-hooks`  
Scope: `full repo` (`opción 1` del menú consumer)  
Stage policy: `PRE_COMMIT`  
Audit mode: `engine`

## Evidencia de ejecución

- Log visual runtime: `assets/readme/forensics-violations/20260223-042030/refactor-option1-final.log`
- Evidencia estructurada: `.ai_evidence.json`

## Resumen ejecutivo

- Outcome gate: `BLOCK`
- Violaciones totales: `70`
- Violaciones de código (sin SDD): `69`
- Violaciones gobernanza/SDD: `1` (`OPENSPEC_MISSING`)

Severidad canónica enterprise:
- `CRITICAL`: `41`
- `HIGH`: `25`
- `MEDIUM`: `4`
- `LOW`: `0`

Cobertura de reglas:
- `active=417`
- `evaluated=417`
- `matched=11`
- `unevaluated=0`
- `unsupported_auto=0`
- `coverage_ratio=1`

## Top violaciones detectadas

1. `common.types.undefined_in_base_type` → `32`
2. `common.types.record_unknown_requires_type` → `16`
3. `common.error.empty_catch` → `4`
4. `common.types.unknown_without_guard` → `4`
5. `skills.backend.no-empty-catch` → `4`
6. `skills.frontend.no-empty-catch` → `4`
7. `heuristics.ts.child-process-exec-file-sync.ast` → `1`
8. `heuristics.ts.child-process-exec-file-untrusted-args.ast` → `1`
9. `sdd.policy.blocked` (`OPENSPEC_MISSING`) → `1`

## Hallazgos clave de cierre

- La auditoría full-repo sí está evaluando todo el set activo (`417/417`) sin reglas AUTO sin mapear (`unsupported_auto=0`).
- El bloqueo actual no es por cobertura, sino por violaciones reales de reglas y por precondición SDD no satisfecha.
- El resultado final del menú opción `1` y la evidencia `.ai_evidence.json` están alineados en stage (`PRE_COMMIT`) y outcome (`BLOCK`).

## Comandos usados

```bash
printf '1\n10\n' | node bin/pumuki-framework.js > assets/readme/forensics-violations/20260223-042030/refactor-option1-final.log
```

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
