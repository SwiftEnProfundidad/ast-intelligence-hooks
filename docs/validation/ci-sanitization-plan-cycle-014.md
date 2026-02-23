# CI Sanitization Plan — Cycle 014

Plan operativo para sanear CI en `main` tras cierre del ciclo de detección.

## Baseline actual (post-merge)

Fuente de baseline:

- `.audit_tmp/p-adhoc-lines-013-main-pr-checks-unique.tsv`
- `.audit_tmp/p-adhoc-lines-014-ci-failure-map.md`

Workflows con fallo detectados:

1. `CI` (9 jobs fallando)
2. `Pumuki Package Smoke` (2 jobs)
3. `Pumuki Frontend Gate` (1 job)
4. `Pumuki Deterministic Tests` (1 job)
5. `Pumuki Phase5 Mock Closure` (1 job)
6. `Pumuki Heuristics Tests` (1 job)
7. `Pumuki iOS Gate` (1 job)
8. `Pumuki Backend Gate` (1 job)
9. `Pumuki Android Gate` (1 job)
10. `security/snyk` (error externo)

## Agrupación por dominio

- `Core CI`: Lint, Type Check, Build Verification, matrix Node 18/20 macOS+Ubuntu, Stage Gate Tests, Skills Lock Freshness.
- `Rule gates`: iOS, Android, Backend, Frontend gates.
- `Quality suites`: heuristics tests, deterministic tests.
- `Packaging`: smoke minimal/block.
- `External security`: Snyk status.

## Estrategia incremental (sin bypass admin)

### Fase A — Estabilización base

- Objetivo: verde en `Lint`, `Type Check`, `Build Verification` y `Stage Gate Tests`.
- Salida: PR pequeño orientado a CI core.

### Fase B — Suites de calidad

- Objetivo: verde en `heuristics-tests` y `deterministic-tests`.
- Salida: PR independiente para evitar mezcla de causas.

### Fase C — Gates por plataforma

- Objetivo: verde en `ios-gate`, `android-gate`, `backend-gate`, `frontend-gate`.
- Salida: PR por lote (o por plataforma si hay acoplamiento alto).

### Fase D — Packaging y seguridad

- Objetivo: verde en `package-smoke (minimal/block)` y triage de `security/snyk`.
- Salida: PR técnico + nota operativa para dependencia externa (Snyk) si aplica.

## Criterio de cierre

- `main` sin merge administrativo para cambios funcionales de este ciclo.
- Todos los checks críticos en verde en PR `develop -> main`.
- Evidencia consolidada en `docs/validation/post-merge-main-stability-note.md`.
