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

## Ejecución actual (Lote A — Packaging)

Estado: ✅ completado en local.

### Causa raíz confirmada

1. `check-package-manifest` usaba API legacy de `npm-packlist` (`packlist({path})`) no compatible con v10 (requiere árbol Arborist), provocando crash en CI/local.
2. El paquete publicado omitía `integrations/notifications/emitAuditSummaryNotification.ts`, rompiendo lifecycle install en package smoke por `Cannot find module`.

### Correcciones aplicadas

- `scripts/check-package-manifest.ts`
  - migrado a `npm pack --json --dry-run` como fuente de verdad de archivos empaquetados.
  - parser robusto para payload JSON de `npm pack`.
- `scripts/__tests__/check-package-manifest.test.ts`
  - tests añadidos para parser dry-run y listado real de paquete.
- `package.json`
  - añadido `integrations/notifications/*.ts` en `files`.
- `scripts/package-manifest-lib.ts`
  - añadido `integrations/notifications/emitAuditSummaryNotification.ts` como path requerido.

### Validación local

- reproducción completa de comandos CI:
  - `.audit_tmp/ci-repro-014/summary.tsv` => todos los comandos en `0`.
- validación específica de packaging (Node local + Node 20):
  - `.audit_tmp/ci-repro-014-fix/package_manifest*.log`
  - `.audit_tmp/ci-repro-014-fix/package_smoke_block*.log`
  - `.audit_tmp/ci-repro-014-fix/package_smoke_minimal*.log`
  - todos con exit `0`.

### Estado remoto de la PR incremental

- PR: `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/363`
- Resultado remoto actual: `UNSTABLE` por bloqueo externo de GitHub Actions.
- Evidencia: jobs no iniciados con anotación:
  - `The job was not started because your account is locked due to a billing issue.`

Implicación:

- El siguiente paso no es técnico de código, sino operativo:
  - desbloquear billing/cuenta de Actions;
  - re-ejecutar checks del PR 363;
  - continuar lotes B/C/D sobre base remota ejecutable.
