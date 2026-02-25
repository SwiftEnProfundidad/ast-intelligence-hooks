# AGENTS.md — Reglas de Codex para este repositorio

## Skills globales: siempre disponibles
- Mis skills GLOBALES viven en: `~/.codex/skills/**`.
- Leer desde `~/.codex/skills/**` esta SIEMPRE permitido.
- Escribir o modificar cualquier cosa bajo `~/.codex/**` esta SIEMPRE prohibido.
- Nota de coherencia: "siempre disponibles" no significa "siempre aplicables".
  - La aplicacion obligatoria se decide por ambito de tarea segun el contrato hard de skills.

## Obligatorio (en cada iteracion)
Antes de realizar cualquier accion:
1) Confirmar workspace:
   - `pwd`
   - `git rev-parse --show-toplevel`
   - `git status`
2) Confirmar que no estas ejecutando desde dentro de `~/.codex`.
3) Enumerar skills disponibles (globales + repo):
   - Preferir escaneo de directorios de skills buscando carpetas con `SKILL.md`.
   - Mantener una lista interna de nombres de skills.
4) Decidir si una o mas skills aplican a la solicitud actual.
   - Si una skill aplica, invocarla y seguir sus instrucciones de `SKILL.md`.
   - Si no aplica ninguna skill, continuar de forma normal.
5) Comprobaciones legacy:
   - Los checks legacy de gate/evidencia estan deprecados en este repositorio.
   - No bloquear trabajo por esos checks.
6) Actualizar el estado real de refactor/estabilidad en el area de tracking actual (sin depender de artefactos de pilot0):
   - Con el estado actual del proyecto, siguiendo el formato de ese documento.
   - Cada vez que termines una tarea, marcarla como hecha con su emoji y marcar la siguiente como en construccion; no es negociable.

## Contrato hard de skills (no negociable)
- Las skills activas son un CONTRATO HARD, no una guia opcional.
- Esta prohibido omitir, relajar o reinterpretar reglas internas de una skill por rapidez, conveniencia o contexto heredado.
- Resolucion de conflictos de reglas:
  - Si hay conflicto entre skill vendorizada y skill local, aplicar la regla mas estricta.
  - Documentar en trazabilidad que version se aplico (vendorizada/local) y por que.
- Reglas hard por ambito:
  - Cambios iOS/Swift/SwiftUI: aplicar SIEMPRE y en conjunto:
    - `windsurf-rules-ios`
    - `swift-concurrency`
    - `swiftui-expert-skill`
  - Cambios Frontend web (React/Next/TypeScript/CSS/UI web): aplicar SIEMPRE:
    - `windsurf-rules-frontend`
  - Cambios Backend (NestJS/TypeScript/API/datos/backend services): aplicar SIEMPRE:
    - `windsurf-rules-backend`
  - Cambios Android (Kotlin/Compose/Android): aplicar SIEMPRE:
    - `windsurf-rules-android`
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
  - Estado/arquitectura/UI segun `swiftui-expert-skill` y `windsurf-rules-ios` cuando aplique iOS/SwiftUI.
  - Reglas frontend segun `windsurf-rules-frontend` cuando aplique web.
  - Reglas backend segun `windsurf-rules-backend` cuando aplique backend.
  - Reglas Android segun `windsurf-rules-android` cuando aplique Android.
  - Rama actual alineada con GitFlow y convencion de naming.
- Si no se puede garantizar este gate, no se permite editar codigo.

## Prohibiciones explicitas
- Prohibido avanzar con implementacion funcional si incumple cualquier regla hard de skill.
- Prohibido cerrar una tarea si hay violaciones conocidas de skills pendientes de corregir.
- Prohibido asumir permiso implicito del usuario para saltar reglas.
- Prohibido ejecutar `merge`, `rebase`, `cherry-pick` o `push --force` sin instruccion explicita del usuario.

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
  - `SKILL`: skill o contrato aplicable (`windsurf-rules-ios`, `swift-concurrency`, `swiftui-expert-skill`, `GitFlow`, etc.).
  - `REGLA`: regla concreta aplicada.
  - `EVIDENCIA`: comando, test, diff, o referencia de linea que prueba cumplimiento.
  - `ESTADO`: `OK` o `BLOCKED`.
- Esta prohibido cerrar una tarea sin esta matriz.

<!-- BEGIN CODEX SKILLS -->
## Skills de Codex (local + vendorizado)

- Precedencia:
  - Mantener la precedencia global ya definida en `AGENTS.md`.
  - Si no esta definida explicitamente, usar: `AGENTS.md > codex skills > prompts de fase`.
- Operativa:
  - Al inicio de cualquier fase, usar primero los archivos vendorizados en `docs/codex-skills/*.md` si existen.
  - Si no existen, intentar leer las rutas locales.
  - Si `docs/codex-skills/` no existe, usar rutas locales sin bloquear la tarea.
  - Aplicar reglas de las skills siempre que no contradigan `AGENTS.md`.

- Skills:
  - `windsurf-rules-android`
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-android/SKILL.md`
    - Vendorizado: `docs/codex-skills/windsurf-rules-android.md`
  - `windsurf-rules-backend`
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-backend/SKILL.md`
    - Vendorizado: `docs/codex-skills/windsurf-rules-backend.md`
  - `windsurf-rules-frontend`
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-frontend/SKILL.md`
    - Vendorizado: `docs/codex-skills/windsurf-rules-frontend.md`
  - `windsurf-rules-ios`
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-ios/SKILL.md`
    - Vendorizado: `docs/codex-skills/windsurf-rules-ios.md`
  - `swift-concurrency`
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/swift-concurrency/SKILL.md`
    - Vendorizado: `docs/codex-skills/swift-concurrency.md`
  - `swiftui-expert-skill`
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/swiftui-expert-skill/SKILL.md`
    - Vendorizado: `docs/codex-skills/swiftui-expert-skill.md`

- Comando de sincronizacion: `./scripts/sync-codex-skills.sh`
<!-- END CODEX SKILLS -->
