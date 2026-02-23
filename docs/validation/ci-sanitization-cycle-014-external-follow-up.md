# CI Sanitization External Follow-up — Cycle 014

Seguimiento operativo posterior al cierre administrativo del ciclo `014`, orientado a convertirlo en cierre estricto remoto cuando se restablezcan dependencias externas.

## Objetivo

- detectar en cuanto GitHub Actions vuelva a ejecutar jobs reales y Snyk deje de devolver estado externo en error;
- ejecutar una revalidación estricta **sin admin merge**;
- publicar evidencia final y cerrar seguimiento.

## Señales de desbloqueo requeridas

1. Jobs de Actions con ejecución real:
   - `runner_id != 0`
   - `steps` no vacío en API.
2. `security/snyk (swiftenprofundidad)` en estado `SUCCESS` o, como mínimo, estado operativo verificable no bloqueante.

## Rutina de verificación (rápida)

1. Verificar PRs abiertas:
   - `gh pr list --state open --json number,title,headRefName,baseRefName,url`
2. Si no hay PR de control, crear PR `develop -> main`:
   - `gh pr create --base main --head develop --title "chore(ci): strict revalidation after external unblock" --body "Revalidación estricta post-restablecimiento de dependencias externas."`
3. Capturar estado de checks:
   - `gh pr view <PR_NUM> --json statusCheckRollup,commits > .audit_tmp/p-adhoc-lines-015-pr-<PR_NUM>-status.json`
4. Muestrear jobs críticos por API (CI, gate, package smoke) y guardar artefactos en `.audit_tmp/`.

## Criterio de paso a cierre estricto remoto

- PR de control con checks críticos en verde sin merge administrativo.
- evidencia JSON/markdown actualizada en `docs/validation/`.

## Entregables esperados al cierre

1. actualización de `docs/validation/post-merge-main-stability-note.md` con el resultado estricto remoto;
2. actualización de `docs/REFRACTOR_PROGRESS.md` cerrando `F014.E.T3` y `P-ADHOC-LINES-015`;
3. si aplica, nuevo documento de cierre estricto final del ciclo 014.

## Estado actual (2026-02-23)

- seguimiento activo por bloqueo externo (billing de Actions + dependencia Snyk).
- cierre administrativo ya publicado en:
  - `docs/validation/ci-sanitization-cycle-014-administrative-closure.md`

## Sondeo #1 de seguimiento externo (2026-02-23)

PR usada para muestra reciente:

- `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/382`

Resultado agregado:

- `37/37` checks no verdes.
- `security/snyk (swiftenprofundidad)` continúa en `ERROR`.

Muestreo API de jobs (dominios distintos):

- CI (`job 64557071687`) -> `runner_id=0`, `steps=[]`
- Android gate (`job 64557071688`) -> `runner_id=0`, `steps=[]`
- package-smoke minimal (`job 64557059070`) -> `runner_id=0`, `steps=[]`

Evidencia:

- `.audit_tmp/p-adhoc-lines-015-pr-382-status.json`
- `.audit_tmp/p-adhoc-lines-015-pr-382-checks.json`
- `.audit_tmp/p-adhoc-lines-015-pr382-ci-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr382-android-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr382-package-minimal-job.json`

## Sondeo #2 de seguimiento externo (2026-02-23)

PR usada para muestra más reciente:

- `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/383`

Resultado agregado:

- `37/37` checks no verdes.
- `security/snyk (swiftenprofundidad)` continúa en `ERROR`.

Muestreo API de jobs (dominios distintos):

- CI (`job 64557374543`) -> `runner_id=0`, `steps=[]`
- Android gate (`job 64557374375`) -> `runner_id=0`, `steps=[]`
- package-smoke minimal (`job 64557365834`) -> `runner_id=0`, `steps=[]`

Evidencia:

- `.audit_tmp/p-adhoc-lines-015-pr-383-status.json`
- `.audit_tmp/p-adhoc-lines-015-pr-383-checks.json`
- `.audit_tmp/p-adhoc-lines-015-pr383-ci-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr383-android-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr383-package-minimal-job.json`

## Sondeo #3 de seguimiento externo (2026-02-23)

PR usada para muestra más reciente:

- `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/384`

Resultado agregado:

- `37/37` checks no verdes.
- `security/snyk (swiftenprofundidad)` continúa en `ERROR`.

Muestreo API de jobs (dominios distintos):

- CI (`job 64557675433`) -> `runner_id=0`, `steps=[]`
- Android gate (`job 64557694981`) -> `runner_id=0`, `steps=[]`
- package-smoke minimal (`job 64557685823`) -> `runner_id=0`, `steps=[]`

Evidencia:

- `.audit_tmp/p-adhoc-lines-015-pr-384-status.json`
- `.audit_tmp/p-adhoc-lines-015-pr-384-checks.json`
- `.audit_tmp/p-adhoc-lines-015-pr384-ci-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr384-android-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr384-package-minimal-job.json`

## Sondeo #4 de seguimiento externo (2026-02-23)

PR usada para muestra más reciente:

- `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/385`

Resultado agregado:

- `37/37` checks no verdes.
- `security/snyk (swiftenprofundidad)` continúa en `ERROR`.

Muestreo API de jobs (dominios distintos):

- CI (`job 64558013079`) -> `runner_id=0`, `steps=[]`
- Android gate (`job 64557997884`) -> `runner_id=0`, `steps=[]`
- package-smoke minimal (`job 64558021056`) -> `runner_id=0`, `steps=[]`

Evidencia:

- `.audit_tmp/p-adhoc-lines-015-pr-385-status.json`
- `.audit_tmp/p-adhoc-lines-015-pr-385-checks.json`
- `.audit_tmp/p-adhoc-lines-015-pr385-ci-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr385-android-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr385-package-minimal-job.json`

## Sondeo #5 de seguimiento externo (2026-02-23)

PR usada para muestra más reciente:

- `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/386`

Resultado agregado:

- `37/37` checks no verdes.
- `security/snyk (swiftenprofundidad)` continúa en `ERROR`.

Muestreo API de jobs (dominios distintos):

- CI (`job 64558929647`) -> `runner_id=0`, `steps=[]`
- Android gate (`job 64558937376`) -> `runner_id=0`, `steps=[]`
- package-smoke minimal (`job 64558944470`) -> `runner_id=0`, `steps=[]`

Evidencia:

- `.audit_tmp/p-adhoc-lines-015-pr-386-status.json`
- `.audit_tmp/p-adhoc-lines-015-pr-386-checks.json`
- `.audit_tmp/p-adhoc-lines-015-pr386-ci-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr386-android-job.json`
- `.audit_tmp/p-adhoc-lines-015-pr386-package-minimal-job.json`
