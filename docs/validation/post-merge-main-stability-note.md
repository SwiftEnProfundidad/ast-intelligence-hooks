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
