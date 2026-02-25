# C023 - MVP Hotspots (Phase 0)

Plan operativo oficial para implementar hotspots locales en el monorepo tras el cierre de `C022`.

## Leyenda

- ✅ Hecho
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Scope del MVP

- Incluido:
  - analisis local del repositorio actual
  - ranking de hotspots por fichero con salida reproducible
  - comando CLI local y reportes (`json` + `markdown`) con rutas clicables
- No incluido en MVP:
  - SaaS
  - multi-repo
  - persistencia remota o panel web

## Baseline T0 (entrada de fase 0)

Fuente versionada:

- `assets/benchmarks/c023-hotspots-mvp-t0-v001.json`
- `assets/benchmarks/c023-hotspots-mvp-t0-v001-baseline.json`

Snapshot T0:

- `stage`: `PRE_COMMIT`
- `audit_mode`: `engine`
- `outcome`: `BLOCK`
- `files_scanned`: `987`
- `total_violations`: `19`
- `CRITICAL`: `18`
- `HIGH`: `1`
- `MEDIUM`: `0`
- `LOW`: `0`
- `rules_coverage`: `active=417`, `evaluated=417`, `unevaluated=0`, `coverage_ratio=1`

Evidencia de ejecucion:

- `.audit_tmp/c023-0-t1/benchmark.out`
- `.audit_tmp/c023-0-t1/menu-option1.out`
- `.audit_tmp/c023-0-t1/parity-menu1.out`
- `.audit_tmp/c023-0-t1/enterprise-menu1.json`
- `.audit_tmp/c023-0-t1/summary.json`
- `.audit-reports/c023-hotspots-t0-legacy-parity-menu1.md`

## Fases y tasks

### Fase 0 - Contrato operativo y baseline

- ✅ `C023.0.T1` Baseline `T0` versionada y contrato operativo MVP publicado.

### Fase 1 - Motor de datos hotspots (local)

- ✅ `C023.1.T1` Colector local de churn/autoria por fichero (ventana temporal configurable, sin red externa).
- 🚧 `C023.1.T2` Composicion de senales de riesgo tecnico por fichero usando evidencia local ya disponible.
- ⏳ `C023.1.T3` Formula de score y ranking `top_n` determinista para hotspots.

Entrega de `C023.1.T1`:

- modulo local: `integrations/git/collectFileChurnOwnership.ts`
- contrato exportado: `integrations/git/index.ts`
- pruebas focales: `integrations/git/__tests__/collectFileChurnOwnership.test.ts`
- evidencia TDD:
  - `.audit_tmp/c023-1-t1-red.out`
  - `.audit_tmp/c023-1-t1-red-tests.out`
  - `.audit_tmp/c023-1-t1-green.out`
  - `.audit_tmp/c023-1-t1-green-tests.out`

### Fase 2 - Superficie CLI y reportes

- ⏳ `C023.2.T1` Comando `pumuki analytics hotspots report` en modo monorepo local.
- ⏳ `C023.2.T2` Exportes `json` y `markdown` con enlaces clicables `./path#Lline`.
- ⏳ `C023.2.T3` Suite TDD (`RED/GREEN/REFACTOR`) para parser CLI, scoring y contratos de salida.

### Fase 3 - Certificacion MVP y cierre

- ⏳ `C023.3.T1` Revalidacion integral (`tests`, `typecheck`, smoke CLI).
- ⏳ `C023.3.T2` Consolidacion documental estable de MVP hotspots.
- ⏳ `C023.3.T3` Cierre Git Flow y sincronizacion de ramas protegidas.

## Reglas operativas del ciclo

- Solo una tarea en estado `🚧` en todo momento.
- Todo cambio se ejecuta con evidencia `RED -> GREEN -> REFACTOR`.
- No se introduce alcance fuera de MVP sin instruccion explicita.

## Backlog post-MVP

- `NO_MVP_SAAS_MULTI_REPO`: SaaS y multi-repo quedan diferidos hasta cierre de MVP local.

## NEXT

NEXT: ejecutar `C023.1.T2` (composicion de senales de riesgo tecnico sobre la salida del colector local).
