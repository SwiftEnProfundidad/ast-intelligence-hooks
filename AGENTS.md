# AGENTS.md — Reglas de Codex para este repositorio

## Idioma y comunicación
- MUST: Responder siempre en español.
- MUST: Mantener trazabilidad en cada entrega (`escenario -> tests -> evidencia -> task`).
- MUST: Al cerrar cada iteración, responder siempre con `MD de seguimiento` y `task actual`.

## Project mode
- PROJECT MODE: brownfield

## Producto Pumuki (baseline vs adaptadores)
- MUST: La **línea base** es **agnóstica al IDE**: hooks Git gestionados, gate, lifecycle, evidencia, políticas. En **`pre-commit`** y **`pre-push`**, el bloque gestionado ejecuta **primero** `pumuki-pre-write` (SDD / stage **PRE_WRITE**) y **después** `pumuki-pre-commit` o `pumuki-pre-push`. Opt-out: `PUMUKI_SKIP_CHAINED_PRE_WRITE=1`.
- MUST: Tras **`pumuki install`**, si no existe, se genera **`.pumuki/adapter.json`** con comandos canónicos de hooks y **MCP stdio** (referencia en el repo para cualquier cliente MCP; no sustituye registrar el servidor en un IDE).
- MUST: **Ficheros propios de un IDE** (p. ej. `.cursor/mcp.json`) siguen siendo **opt-in** (`pumuki install --with-mcp --agent=…`, `bootstrap --enterprise`).

## Skills requeridos
- REQUIRED SKILL: enterprise-operating-system
- REQUIRED SKILL: ios-enterprise-rules
- REQUIRED SKILL: swift-concurrency
- REQUIRED SKILL: swiftui-expert-skill
- REQUIRED SKILL: android-enterprise-rules
- REQUIRED SKILL: backend-enterprise-rules
- REQUIRED SKILL: frontend-enterprise-rules

## Cadena de skills
- La cadena canónica es:
  1. `AGENTS.md`
  2. `vendor/skills/` del repo (si existe)
  3. `skills.sources.json`
  4. `skills.lock.json`
  5. `~/.agents/skills` como capa global canónica
  6. `~/.codex/skills/public` solo como compatibilidad legacy
- `skills.sources.json` y `skills.lock.json` son artefactos generados, no punto de entrada humano.
- Leer skills desde `~/.agents/skills/**` y `~/.codex/skills/public/**` está permitido.
- Escribir o modificar cualquier cosa bajo `~/.codex/**` o `~/.agents/**` está prohibido.

## Obligatorio (en cada iteracion)
Antes de realizar cualquier accion:
1) Confirmar workspace:
   - `pwd`
   - `git rev-parse --show-toplevel`
   - `git status`
2) Confirmar que no estas ejecutando desde dentro de `~/.codex` ni `~/.agents`.
3) Enumerar skills disponibles (repo + globales):
   - Preferir `vendor/skills/` si existe.
   - Si no existe, resolver desde `~/.agents/skills`.
   - Usar `~/.codex/skills/public` solo como compatibilidad legacy.
4) Decidir si una o mas skills aplican a la solicitud actual.
   - Si una skill aplica, invocarla y seguir sus instrucciones de `SKILL.md`.
   - Si no aplica ninguna skill, continuar de forma normal.
5) Comprobaciones legacy:
   - Los checks legacy de gate/evidencia estan deprecados en este repositorio.
   - No bloquear trabajo por esos checks.
6) Actualizar el estado real de refactor/estabilidad en el area de tracking actual (sin depender de artefactos de piloto):
   - con el estado actual del proyecto, siguiendo el formato de ese documento.
   - cada vez que termines una tarea, marcarla como hecha con su emoji y marcar la siguiente como en construccion; no es negociable.

## Contrato hard de skills (no negociable)
- Las skills activas son un CONTRATO HARD, no una guia opcional.
- Esta prohibido omitir, relajar o reinterpretar reglas internas de una skill por rapidez, conveniencia o contexto heredado.
- Resolucion de conflictos de reglas:
  - Si hay conflicto entre skill vendorizada y skill local, aplicar la regla mas estricta.
  - Documentar en trazabilidad que version se aplico (vendorizada/local) y por que.
- Reglas hard por ambito:
  - Cambios iOS/Swift/SwiftUI: aplicar SIEMPRE y en conjunto:
    - `ios-enterprise-rules`
    - `swift-concurrency`
    - `swiftui-expert-skill`
  - Cambios Frontend web (React/Next/TypeScript/CSS/UI web): aplicar SIEMPRE:
    - `frontend-enterprise-rules`
  - Cambios Backend (NestJS/TypeScript/API/datos/backend services): aplicar SIEMPRE:
    - `backend-enterprise-rules`
  - Cambios Android (Kotlin/Compose/Android): aplicar SIEMPRE:
    - `android-enterprise-rules`
- Si una tarea toca multiples ambitos, aplicar TODAS las skills relevantes en conjunto.
- No se permite aplicar solo una parte de esas skills ni hacer cherry-picking de reglas.
- Si una regla de skill entra en conflicto con codigo existente, se corrige el codigo para cumplir la regla (no al reves), salvo instruccion explicita del usuario.
- Si una regla no se puede cumplir tecnicamente en ese momento:
  - detener implementacion,
  - declarar `STATUS: BLOCKED`,
  - explicar la regla exacta bloqueante, y
  - pedir decision explicita del usuario antes de continuar.

## Contrato hard de GitFlow y ramas (no negociable)
- El ciclo GitFlow del proyecto es obligatorio.
- Es obligatorio respetar ramas nombradas segun la convencion acordada del repositorio.
- Esta prohibido trabajar en una rama que no corresponda al tipo de tarea o fase.
- Esta prohibido hacer commits en una rama fuera de convencion o fuera del flujo esperado.
- Esta prohibido mezclar trabajo de ramas distintas sin instruccion explicita del usuario.
- Convencion de naming hard por defecto (si el repo no define otra mas estricta):
  - `main`
  - `develop`
  - `feature/<descripcion-kebab-case>`
  - `bugfix/<descripcion-kebab-case>`
  - `hotfix/<descripcion-kebab-case>`
  - `release/<semver>`
  - `chore/<descripcion-kebab-case>`
  - `refactor/<descripcion-kebab-case>`
  - `docs/<descripcion-kebab-case>`
- Flujo hard por tipo de rama:
  - `feature/*`, `bugfix/*`, `chore/*`, `refactor/*`, `docs/*`: deben salir de `develop`.
  - `release/*`: debe salir de `develop` y solo contener cambios de estabilizacion/release.
  - `hotfix/*`: debe salir de `main` para fixes urgentes de produccion.
- Esta prohibido commitear en `main` y `develop` sin instruccion explicita del usuario.
- Si la rama actual no cumple naming o flujo:
  - detener implementacion,
  - declarar `STATUS: BLOCKED`,
  - explicar el conflicto de rama/flujo, y
  - pedir al usuario el cambio o confirmacion de rama antes de continuar.

## Gate operativo obligatorio (antes de editar codigo)
- Declarar internamente las skills aplicables y tratarlas como activas durante TODO el turno.
- Verificar cumplimiento minimo previo:
  - BDD/TDD requerido por la skill correspondiente.
  - Concurrencia y aislamiento segun `swift-concurrency` cuando haya codigo Swift.
  - Estado/arquitectura/UI segun `swiftui-expert-skill` e `ios-enterprise-rules` cuando aplique iOS/SwiftUI.
  - Reglas frontend segun `frontend-enterprise-rules` cuando aplique web.
  - Reglas backend segun `backend-enterprise-rules` cuando aplique backend.
  - Reglas Android segun `android-enterprise-rules` cuando aplique Android.
  - Rama actual alineada con GitFlow y convencion de naming.
- Si no se puede garantizar este gate, no se permite editar codigo.

## Prohibiciones explicitas
- Prohibido avanzar con implementacion funcional si incumple cualquier regla hard de skill.
- Prohibido cerrar una tarea si hay violaciones conocidas de skills pendientes de corregir.
- Prohibido asumir permiso implicito del usuario para saltar reglas.
- Prohibido ejecutar `merge`, `rebase`, `cherry-pick` o `push --force` sin instruccion explicita del usuario.

## Contrato hard anti-bucle y prioridad de bugs externos (no negociable)
- Los bugs reportados por repos consumidores son prioridad absoluta sobre cualquier task interna del repo.
- Las fuentes canonicas externas son:
  - `/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS/docs/pumuki/PUMUKI_BUGS_MEJORAS.md`
  - `/Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO/docs/technical/08-validation/refactor/pumuki-integration-feedback.md`
  - `/Users/juancarlosmerlosalbarracin/Developer/Projects/Flux_training/docs/BUGS_Y_MEJORAS_PUMUKI.md`
- La unica fuente viva del tracking interno es `PUMUKI-RESET-MASTER-PLAN.md`.
- Los antiguos MDs internos bajo `docs/tracking/` quedan retirados del repo y no pueden reintroducirse como backlog fuente.
- El bucle previo se produjo por mantener espejos internos compitiendo con backlog externo y con el propio reset.
- Desde este punto, ningun documento de seguimiento fuera de `PUMUKI-RESET-MASTER-PLAN.md` puede actuar como backlog, criterio de prioridad ni prueba de avance.
- Regla hard nueva:
  - si existe aunque sea un bug abierto en cualquiera de los MDs externos,
  - la unica task `🚧` permitida en el tracking interno debe corresponder a uno de esos bugs externos,
  - y queda prohibido arrancar, continuar o cerrar cualquier `PUMUKI-2xx` de refactor interno salvo que sea estrictamente necesaria para cerrar ese bug externo.
- Si el tracking interno muestra una `🚧` distinta de un bug externo mientras haya bugs externos abiertos:
  - eso cuenta como violacion hard del proceso,
  - el estado correcto pasa a ser `STATUS: BLOCKED`,
  - y la unica accion permitida es corregir el tracking y volver al bug externo prioritario.
- Si cualquiera de esos MDs contiene items abiertos (`🚧`, `⏳`, `⛔`, `OPEN`, `REPORTED`, `STOP`), quedan congeladas todas las tasks internas `PUMUKI-2xx` que no sean estrictamente necesarias para resolver ese bug externo.
- Esta prohibido abrir, continuar o cerrar tareas internas de refactor, docs, tracking o modularizacion mientras exista un bug externo abierto que aun no tenga:
  - reproduccion,
  - fix,
  - tests/regresion,
  - release util si aplica,
  - y actualizacion del MD externo correspondiente.
- Antes de iniciar cualquier task interna nueva, comprobar explicitamente el estado de los tres MDs externos.
- Si los MDs externos y el tracking interno entran en conflicto:
  - los MDs externos ganan automaticamente,
  - el tracking interno se considera incorrecto,
  - y debe corregirse en el mismo turno antes de tocar codigo funcional.
- Si el modelo detecta que se esta desviando a trabajo interno con bugs externos abiertos:
  - debe parar,
  - declarar el desvio en la respuesta,
  - corregir `PUMUKI-RESET-MASTER-PLAN.md` en ese mismo turno,
  - corregir el tracking interno,
  - y volver en ese mismo turno al bug externo prioritario.
- Si el modelo vuelve a abrir una task interna no alineada con bugs externos abiertos:
  - declarar `STATUS: BLOCKED`,
  - no editar mas codigo funcional,
  - reparar primero el tracking,
  - y solo despues continuar con el bug externo prioritario.
- Queda explicitamente prohibido usar el cierre de tasks internas `PUMUKI-2xx` como prueba de avance del producto mientras `SAAS`, `RuralGo` o `Flux` mantengan bugs abiertos.

## Contrato hard de release y adopcion en consumers
- Si un cambio ya aporta valor real a repos consumidores, tiene tests verdes y no introduce regresiones conocidas, preparar y ejecutar una nueva publicacion de `pumuki`.
- Tras cada publicacion util, y siempre que el usuario haya definido repos consumidores activos para rollout, ejecutar el ciclo:
  - verificar publicacion remota,
  - actualizar consumers a la nueva version,
  - revalidar `status` / `doctor` / hooks segun aplique,
  - actualizar el tracking real de esos consumers si cambia su estado.
- No dejar consumidores largos periodos sobre una version antigua si ya existe una release estable que corrige bugs o mejoras que les afectan directamente.
- Si publicar o actualizar consumers implica riesgo no obvio, explicarlo antes; si no, tratarlo como parte normal del ciclo enterprise.

## Contrato hard de higiene documental y artefactos (enterprise clean)
- Objetivo no negociable: mantener el repositorio limpio, trazable y sin acumulacion de basura operativa.
- Prohibido crear un `.md` nuevo por cada micro-paso si la informacion cabe en un documento existente.
- Antes de crear cualquier archivo en `docs/**`, verificar y priorizar actualizacion de:
  - `docs/ENTERPRISE_EXECUTION_CYCLE_*.md`
  - `docs/REFRACTOR_PROGRESS.md`
  - `docs/README.md`
  - `docs/validation/README.md`
- Crear un `.md` nuevo solo si:
  - lo pide explicitamente el usuario, o
  - es un hito contractual de fase/ciclo que no puede consolidarse en un documento ya existente.
- Si se crea un `.md` nuevo, en la misma entrega es obligatorio:
  - indexarlo en los `README` correspondientes,
  - consolidar o eliminar `.md` redundantes del mismo ambito funcional,
  - dejar una sola fuente de verdad por tema.
- Prohibido versionar artefactos efimeros de ejecucion o diagnostico:
  - `.audit_tmp/**`, `.audit-reports/**`, `.coverage/**`
  - `*.out`, `*.exit`, `*.log`, `*.tmp`, `*.bak`, `*.orig`, `*.rej`
- Limpieza obligatoria antes de cerrar cualquier tarea:
  - eliminar artefactos efimeros locales,
  - eliminar directorios vacios huerfanos,
  - verificar que `git status` no muestra basura no trackeada fuera del alcance de la tarea.
- Criterio de bloqueo hard:
  - si un archivo no aporta valor profesional claro (producto, arquitectura, operacion estable o compliance), no se mantiene.
  - si hay duda razonable, declarar `STATUS: BLOCKED` y pedir decision explicita del usuario para conservar o eliminar.

## Seguridad del repositorio
- Hacer cambios SOLO dentro de este repositorio.
- Evitar refactors amplios salvo peticion explicita.
- Para operaciones destructivas (`delete/drop/apply/destroy`), PARAR y preguntar.

## Secretos
- Nunca imprimir ni registrar secretos (API keys, tokens, service role keys o credenciales).
- Si detectas un secreto, reportar solo ruta del archivo + remediacion (sin mostrar el valor).

## Protocolo de entrega
Al finalizar cualquier tarea, siempre reportar:
- STATUS (`DONE`/`BLOCKED`)
- BRANCH
- FILES CHANGED
- COMMANDS RUN
- NEXT instruction

## Plantilla obligatoria de trazabilidad por turno (hard)
- En cada entrega final, incluir una matriz de trazabilidad por archivo con este formato minimo:
  - `ARCHIVO | SKILL | REGLA | EVIDENCIA | ESTADO`
- Donde:
  - `ARCHIVO`: ruta absoluta del archivo afectado.
  - `SKILL`: skill o contrato aplicable (`ios-enterprise-rules`, `swift-concurrency`, `swiftui-expert-skill`, `GitFlow`, etc.).
  - `REGLA`: regla concreta aplicada.
  - `EVIDENCIA`: comando, test, diff, o referencia de linea que prueba cumplimiento.
  - `ESTADO`: `OK` o `BLOCKED`.
- Esta prohibido cerrar una tarea sin esta matriz.

<!-- BEGIN CODEX SKILLS -->
## Skills de Codex (local + vendorizado)

- Precedencia:
  - Mantener la precedencia global ya definida en `AGENTS.md`.
  - Si no esta definida explicitamente, usar: `AGENTS.md > vendor/skills > ~/.agents/skills > ~/.codex/skills/public`.
- Operativa:
  - Al inicio de cualquier fase, usar primero los archivos vendorizados en `docs/codex-skills/*.md` si existen.
  - Si no existen, intentar leer las rutas locales canónicas.
  - Si `docs/codex-skills/` no existe, usar rutas locales sin bloquear la tarea.
  - Aplicar reglas de las skills siempre que no contradigan `AGENTS.md`.

- Skills:
  - `android-enterprise-rules`
    - Local: `/Users/juancarlosmerlosalbarracin/.agents/skills/android-enterprise-rules/SKILL.md`
    - Vendorizado: `docs/codex-skills/android-enterprise-rules.md`
  - `backend-enterprise-rules`
    - Local: `/Users/juancarlosmerlosalbarracin/.agents/skills/backend-enterprise-rules/SKILL.md`
    - Vendorizado: `docs/codex-skills/backend-enterprise-rules.md`
  - `frontend-enterprise-rules`
    - Local: `/Users/juancarlosmerlosalbarracin/.agents/skills/frontend-enterprise-rules/SKILL.md`
    - Vendorizado: `docs/codex-skills/frontend-enterprise-rules.md`
  - `ios-enterprise-rules`
    - Local: `/Users/juancarlosmerlosalbarracin/.agents/skills/ios-enterprise-rules/SKILL.md`
    - Vendorizado: `docs/codex-skills/ios-enterprise-rules.md`
  - `swift-concurrency`
    - Local: `/Users/juancarlosmerlosalbarracin/.agents/skills/swift-concurrency/SKILL.md`
    - Vendorizado: `docs/codex-skills/swift-concurrency.md`
  - `swiftui-expert-skill`
    - Local: `/Users/juancarlosmerlosalbarracin/.agents/skills/swiftui-expert-skill/SKILL.md`
    - Vendorizado: `docs/codex-skills/swiftui-expert-skill.md`

- Comando de sincronizacion: `./scripts/sync-codex-skills.sh`
<!-- END CODEX SKILLS -->
