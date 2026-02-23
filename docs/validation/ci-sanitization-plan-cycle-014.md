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

## Estado tras cierre Git Flow del lote A

- PR `#363` merged a `develop`:  
  `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/363`
- PR `#364` merged a `main` con admin (bloqueo externo persistente):  
  `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/364`
- Ramas sincronizadas tras promote: `origin/main...origin/develop = 0/0`.

## Ejecución actual (Lote C — Platform Gates)

Estado: ✅ completado en local (con corrección de contrato de workflow).

### Causa raíz confirmada

1. Los workflows de platform gate (`pumuki-ios/android/backend/frontend.yml`) apuntaban a `integrations/git/ci*.ts`.
2. Esos entrypoints `ci*.ts` solo re-exportan funciones y no ejecutan `runCliCommand`, por lo que el runner de gate no se lanzaba realmente.

### Correcciones aplicadas

- Workflows actualizados a entrypoints ejecutables:
  - `integrations/git/ciIOS.cli.ts`
  - `integrations/git/ciAndroid.cli.ts`
  - `integrations/git/ciBackend.cli.ts`
  - `integrations/git/ciFrontend.cli.ts`
- TDD de contrato añadido:
  - `scripts/__tests__/platform-gates-workflow-contract.test.ts`

### Validación local

- Contrato workflow red/green:
  - red inicial: 4/4 fallos (runner_path incorrecto)
  - green final: 4/4 OK tras fix
- Gates ejecutados localmente:
  - sin bypass: `ios=1`, `android=1`, `backend=1`, `frontend=1` por `OPENSPEC_MISSING`
  - con bypass (`PUMUKI_SDD_BYPASS=1`): `ios=0`, `android=0`, `backend=0`, `frontend=0`
- Evidencia:
  - `.audit_tmp/p-adhoc-lines-014-lotC-gates-exit-codes.txt`
  - `.audit_tmp/p-adhoc-lines-014-lotC-gates-bypass-exit-codes.txt`

## Cierre pendiente del ciclo 014

Dependencia externa no resuelta:

- desbloqueo de billing en GitHub Actions.

Validación final requerida al desbloquear:

1. lanzar PR de control `develop -> main` sin bypass admin;
2. verificar ejecución real de jobs (sin `runner_id=0`, con `steps` poblados);
3. exigir checks críticos en verde para dar cierre definitivo al ciclo.
