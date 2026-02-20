# PUMUKI Cycle 21 — Scope Tracker

Seguimiento simple del ciclo 21 para mantener ejecución finita, sin bucles y con visibilidad completa.

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

## Criterio de salida verificable

- Comando único:
  - `cd /Users/juancarlosmerlosalbarracin/Developer/Projects/pumuki-mock-consumer && npm install --save-exact pumuki@latest && npm run pumuki:matrix`
- Salida esperada:
  - `=== scenario:clean ===` con `status: PASS`
  - `=== scenario:violations ===` con `status: PASS`
  - `=== scenario:mixed ===` con `status: PASS`
  - línea final: `All scenario matrix checks passed for package: pumuki@latest`
- Exit code esperado:
  - `0`

## Tareas del ciclo

- ✅ C21-T1: Abrir tracker del ciclo con alcance único y criterio verificable.
- ✅ C21-T2: Ejecutar preflight del mock (`branch/upstream/working tree`) y confirmar baseline limpia.
- ✅ C21-T3: Ejecutar comando único del criterio y capturar salida real.
- ✅ C21-T4: Ejecutar validación final del alcance (re-ejecución + verificación de artefacto).
- ✅ C21-T5: Cerrar ciclo (actualizar trackers + commit/push).

## Regla Anti-Bucle

- 1 ciclo = 1 alcance cerrado.
- Máximo 5 tareas.
- No se añaden tareas nuevas durante la ejecución del ciclo.
- Solo puede existir una tarea `🚧` a la vez.
