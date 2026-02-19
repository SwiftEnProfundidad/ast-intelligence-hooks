# PUMUKI Cycle 13 — Scope Tracker

Seguimiento simple del ciclo 13 para mantener ejecución finita, sin bucles y con visibilidad completa.

## Leyenda

- ✅ Completada
- 🚧 En progreso (solo 1 activa)
- ⏳ Pendiente

## Alcances posibles (elegir 1)

- Seguridad y dependencias.
- Runtime Pumuki (gates, evidence, MCP).
- Validación end-to-end en `pumuki-mock-consumer`.
- UX operativa (menú/comandos/runbook).
- Documentación de release y operación.

## Alcance elegido del ciclo

- Validación end-to-end en `pumuki-mock-consumer`.

## Tareas del ciclo

- ✅ C13-T1: Confirmar alcance único del ciclo (elegir 1 de la lista anterior).
- ✅ C13-T2: Definir criterio de salida verificable (comando + salida esperada + exit code).
- ✅ C13-T3: Ejecutar implementación del alcance (máximo 5 tareas atómicas).
- ✅ C13-T4: Ejecutar validación final del alcance (tests/comandos en verde).
- ✅ C13-T5: Cerrar ciclo (actualizar trackers + commit/push).

## Criterio de salida verificable (C13-T2)

Comando único de ejecución:

```bash
cd /Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer && npm install --save-exact pumuki@latest && npx pumuki install && npm run pumuki:matrix
```

Salida esperada:

- `=== scenario:clean ===` con `results: pre-commit=0 pre-push=0 ci=0` y `status: PASS`.
- `=== scenario:violations ===` con `results: pre-commit=1 pre-push=1 ci=1` y `status: PASS`.
- `=== scenario:mixed ===` con `results: pre-commit=1 pre-push=1 ci=1` y `status: PASS`.
- Línea final: `All scenario matrix checks passed for package: pumuki@latest`.
- Exit code del comando: `0`.

## Ejecución atómica de C13-T3 (máximo 5)

- ✅ C13-T3-A1: Preflight del mock en `pumuki-mock-consumer` (`feat/pumuki-validation`, upstream `main`, working tree limpio).
- ✅ C13-T3-A2: Comando único ejecutado en mock y salida real capturada (`clean=PASS`, `violations=PASS`, `mixed=PASS`, línea final esperada presente, `MATRIX_EXIT=0`).
- ✅ C13-T3-A3: Criterio verificado contra `artifacts/pumuki-matrix-summary.json` (`run_id=pumuki-matrix-20260219T231355Z-17264`, `final_verdict=PASS`, `criteria_pass=true`).
- ✅ C13-T3-A4: Drift residual verificado en mock (`git status --short --branch` sin cambios y `MOCK_DRIFT=NO`).
- ✅ C13-T3-A5: Evidencia consolidada y transición a `C13-T4` completada (`run_id=pumuki-matrix-20260219T231355Z-17264`, `final_verdict=PASS`, patrón `clean=0/0/0`, `violations=1/1/1`, `mixed=1/1/1`, `MATRIX_EXIT=0`, `MOCK_DRIFT=NO`).

## Validación final (C13-T4)

- ✅ C13-T4: Validación final ejecutada en mock con comando de criterio (`run_id=pumuki-matrix-20260219T232030Z-28000`, `final_verdict=PASS`, patrón `clean=0/0/0`, `violations=1/1/1`, `mixed=1/1/1`, línea final esperada presente y `MATRIX_EXIT=0`).

## Regla Anti-Bucle

- 1 ciclo = 1 alcance cerrado.
- Máximo 5 tareas.
- No se añaden tareas nuevas durante la ejecución del ciclo.
- Solo puede existir una tarea `🚧` a la vez.
