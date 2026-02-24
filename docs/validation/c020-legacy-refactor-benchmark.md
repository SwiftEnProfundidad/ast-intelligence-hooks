# C020 - Legacy vs Refactor Benchmark Contract

Contrato oficial del ciclo `020` para comparar deteccion `legacy` vs `refactor` de forma reproducible.

## Objetivo

- Ejecutar una auditoria full-repo del motor actual (menu opcion `1`, `audit_mode=engine`).
- Comparar su salida contra un baseline legacy congelado y versionado en core.
- Publicar diff por severidad con trazabilidad reproducible.

## Corpus fijo (C020.A.T1)

- **Legacy baseline fijo**: `assets/benchmarks/legacy-baseline-precommit-v012.json`
- **Enterprise baseline runtime**: `.audit_tmp/c020-a/enterprise-menu1.json`
- **Salida parity**: `.audit-reports/c020-a-legacy-parity-menu1.md`

Notas:
- El baseline legacy fijo evita dependencia de rutas externas/no versionadas.
- `strict_scope` va desactivado por defecto para tolerar variaciones de `files_scanned` entre snapshots historicos.

## Ejecucion canonica (C020.A.T2)

```bash
npm run validation:c020-benchmark
```

Opciones:

```bash
node --import tsx scripts/run-c020-benchmark.ts \
  --legacy=assets/benchmarks/legacy-baseline-precommit-v012.json \
  --strict-scope \
  --no-sdd-bypass
```

## Resultado actual (C020.A.T3)

Fuente enterprise evaluada:
- `snapshot.stage = PRE_COMMIT`
- `snapshot.audit_mode = engine`
- `snapshot.outcome = BLOCK`
- `snapshot.files_scanned = 982`
- `severity_metrics.total_violations = 144`
- `severity_metrics.by_enterprise_severity = { CRITICAL: 42, HIGH: 43, MEDIUM: 59, LOW: 0 }`
- `rules_coverage.counts = { active: 417, evaluated: 417, unevaluated: 0 }`
- `rules_coverage.coverage_ratio = 1`

Comparativa parity:
- Archivo: `.audit-reports/c020-a-legacy-parity-menu1.md`
- `dominance = PASS` por severidad
- `rule_dominance = FAIL` esperado por baseline legacy sintetico (`baseline.*`) sin mapeo 1:1 a ruleIds enterprise actuales.

## Criterios de aceptacion de la fase A

- Benchmark ejecutable con un solo comando.
- Entradas y salidas deterministicamente ubicadas.
- Diff de severidad publicado.
- Brecha de mapeo ruleId legacy->enterprise explicitada para cierre posterior en fases B/C.
