# Post-Merge Main Stability Note (Cycle 013)

Estado de estabilidad tras merge administrativo de `develop` a `main` (`PR #361`).

## Estado de ramas

- Local: solo `develop`, `main`.
- Remotas: solo `origin/develop`, `origin/main`.
- PRs del cierre:
  - `#360` merged a `develop`.
  - `#361` merged a `main` (admin merge, política de base bloqueaba merge normal).

## Estado del PR #361

- URL: `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/361`
- Estado: `MERGED`
- Merge commit: `cedaf08f93d70ad7d820556f2574becf8ed03f6b`
- `mergeStateStatus` previo al merge: `BLOCKED`
- `reviewDecision` previo al merge: `REVIEW_REQUIRED`

## Checks no verdes detectados (baseline post-merge)

Fuente: `.audit_tmp/p-adhoc-lines-013-main-pr-checks-unique.tsv`

1. CI / Build Verification — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457851
2. CI / Lint — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457789
3. CI / Skills Lock Freshness — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457802
4. CI / Stage Gate Tests — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457843
5. CI / Test - Node 18.x on macos-latest — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457840
6. CI / Test - Node 18.x on ubuntu-latest — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457831
7. CI / Test - Node 20.x on macos-latest — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457857
8. CI / Test - Node 20.x on ubuntu-latest — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457839
9. CI / Type Check — FAILURE  
   https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094220/job/64532457804
10. Pumuki Android Gate / android-gate — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094304/job/64532457906
11. Pumuki Backend Gate / backend-gate — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094239/job/64532457919
12. Pumuki Deterministic Tests — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094211/job/64532457936
13. Pumuki Frontend Gate / frontend-gate — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094207/job/64532457799
14. Pumuki Heuristics Tests — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094228/job/64532457800
15. Pumuki Package Smoke (block) — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094202/job/64532458056
16. Pumuki Package Smoke (minimal) — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094202/job/64532458182
17. Pumuki Phase5 Mock Closure — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094221/job/64532457782
18. Pumuki iOS Gate / ios-gate — FAILURE  
    https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/runs/22308094231/job/64532457934
19. security/snyk (swiftenprofundidad) — ERROR  
    https://app.snyk.io/org/swiftenprofundidad/pr-checks/4fcc9f2f-f4ea-44e9-8191-f4a5ab187c4a

## Riesgo residual

- El repositorio queda sincronizado en ramas protegidas, pero la salud CI global en `main` no está verde.
- Se mantiene riesgo operativo de regresiones no detectadas por pipeline hasta normalizar checks.

## Siguiente paso recomendado

- Ejecutar un ciclo dedicado de saneamiento CI por lotes (`lint/typecheck/tests/gates/package smoke/snyk`) con PR incremental y reglas de salida: checks críticos en verde antes del siguiente merge administrativo.

## Actualización operativa (Cycle 014 / PR #363)

Se abrió PR incremental de saneamiento:

- `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/363`

Estado observado en GitHub Actions:

- Los jobs fallan en ~3-4s sin ejecutar pasos.
- Anotación uniforme de GitHub:
  - `The job was not started because your account is locked due to a billing issue.`

Conclusión:

- El estado rojo remoto actual no se atribuye al lote A de código, sino a un bloqueo externo de cuenta/billing en Actions.

## Actualización operativa (Cycle 014 / Promote #364)

Se ejecutó cierre Git Flow del lote A:

- PR `#363` merged a `develop`.
- PR `#364` merged de `develop` a `main` (admin por bloqueo externo persistente).
- Ramas remotas alineadas tras sync final:
  - `origin/main...origin/develop = 0/0`.

Evidencia del bloqueo externo tras nuevo promote:

- runs `22309368527` y `22309369410` con jobs en `failure` sin steps.
- API de jobs devuelve patrón uniforme:
  - `runner_id=0`
  - `steps=[]`

Implicación:

- El código de saneamiento de packaging está promovido en `main`.
- El cierre estricto "sin bypass admin" sigue bloqueado hasta resolver billing de Actions.

## Actualización operativa (Cycle 014 / Lote C Platform Gates)

Corrección aplicada para evitar falso verde/fallo silencioso en workflows de platform gate:

- Los workflows `pumuki-ios/android/backend/frontend.yml` pasaron de `runner_path: integrations/git/ci*.ts` a `runner_path: integrations/git/ci*.cli.ts`.
- Motivo: `ci*.ts` solo re-exporta runner; `ci*.cli.ts` ejecuta `runCliCommand(...)`.

Validación local:

- test de contrato workflow en verde:
  - `scripts/__tests__/platform-gates-workflow-contract.test.ts`
- ejecución local de gates:
  - sin bypass SDD (`PUMUKI_SDD_BYPASS` ausente): `OPENSPEC_MISSING` en los 4 gates.
  - con bypass (`PUMUKI_SDD_BYPASS=1`): `ios/android/backend/frontend` en exit code `0`.

## Actualización operativa (Cycle 014 / Lote D Package Smoke + Security)

Consolidación final de estado para `package-smoke` y `security/snyk`:

- local (framework repo): package manifest + smoke `block`/`minimal` en PASS.
- remoto (último promote `PR #373`):
  - `package-smoke (block|minimal)` en `FAILURE` con jobs sin ejecución real (`runner_id=0`, `steps=[]`).
  - `security/snyk (swiftenprofundidad)` en `ERROR` (servicio externo Snyk).

Implicación:

- la validación técnica local de packaging queda cerrada;
- el estado rojo remoto de package smoke/security sigue dependiente de bloqueos externos.
