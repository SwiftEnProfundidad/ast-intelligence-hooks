# Pumuki — plan maestro (reset) + cumplimiento informe RuralGO

**Última actualización del plan:** 2026-04-21 (`pumuki@6.3.97` sigue siendo la línea moderna publicada y `RG-P0-1` cierra otra sub-slice sobre el camino legacy: `v0-legacy-last` queda confirmado como candidato principal al Pumuki “Chevrolet”, existe ya `legacy-chevrolet` separado del `freezer-current`, el legacy instala otra vez en consumers modernos montados como worktree y ya completa `pre-commit`, `wrap-up` e `intent` con superficie viva verificable. El ruido residual de `rules/evidence` queda estabilizado al empaquetar `.cursor/.windsurf rules` en el tarball legacy (`401f87c`) y el warning `Package root not found, skipping skill files installation` queda resuelto al detectar el package root por `package.json` en npm-runtime (`ab8df61`). Además, el primer transplante aceptado desde `freezer-current` ya queda completamente operativo: el legacy escribe `.pumuki/adapter.json` como capa agnóstica opcional, registra ese artefacto en el bloque gestionado de `.git/info/exclude` (`1f04809`) y, tras corregir la semántica real del manifest, el replay en consumer moderno confirma que `pre_commit` ejecuta el hook bloqueante, `pre_push` corre validación GitFlow útil y `mcp.automation` devuelve sesión MCP verificable con `initialize + tools/list`. Ajuste adicional de política legacy: el `pre-commit` ya no bloquea solo por `CRITICAL/HIGH`; desde `refactor/legacy-worktree-compat` bloquea también por `MEDIUM` y `LOW`, con regresión ejecutable del hook generando `AST SUMMARY LEVELS: CRITICAL=0 HIGH=0 MEDIUM=1 LOW=0`. Las cuarenta y dos primeras traducciones reales `ruleId -> detector AST legacy` quedan ya cerradas con detección AST operativa: `skills.ios.no-navigation-view` deja de vivir en regex estática, pasa a detectarse desde el subárbol AST de `View` en `ios-ast-intelligent-strategies.js` y se retira el patrón legacy correspondiente de `iOSModernPracticesRules.js`; `skills.ios.no-sheet-is-presented` ya se detecta por AST al localizar `.sheet(isPresented:)` dentro de un `View`, manteniendo `.sheet(item:)` como caso limpio; `skills.ios.no-legacy-onchange` ya se detecta por AST al localizar `onChange(of:)` con cierre monádico dentro de un `View`, manteniendo el overload moderno de dos parámetros como caso limpio; `skills.ios.no-foreground-color` ya se detecta por AST al localizar `foregroundColor` dentro del subárbol de un `View`, manteniendo `foregroundStyle` como caso limpio sin reintroducir enforcement estático; `skills.ios.no-corner-radius` ya se detecta por AST al localizar `cornerRadius` dentro de un `View`, manteniendo `clipShape(.rect(cornerRadius:))` como caso limpio sin introducir enforcement estático; `skills.ios.no-tab-item` ya se detecta por AST al localizar `tabItem` dentro de un `View`, manteniendo la nueva `Tab` API como caso limpio sin introducir enforcement estático; `skills.ios.no-scrollview-shows-indicators` ya se detecta por AST al localizar `ScrollView(..., showsIndicators: ...)` dentro de un `View`, manteniendo `.scrollIndicators(.hidden)` como caso limpio sin introducir enforcement estático; `skills.ios.no-observable-object` ya se detecta por AST al localizar clases que heredan `ObservableObject`, manteniendo `@Observable` como caso limpio; y `skills.ios.no-legacy-swiftui-observable-wrapper` ya se detecta por AST al localizar `@StateObject` o `@ObservedObject` dentro de structs `View`, preservando `@State` y `@Bindable` como casos limpios; y `skills.ios.no-passed-value-state-wrapper` ya se detecta por AST al localizar `@State` o `@StateObject` reenvueltos desde parámetros del `init`, preservando `@Binding` y el estado local propio como casos limpios; y `skills.ios.no-on-tap-gesture` ya se detecta por AST al localizar `onTapGesture` dentro de un `View`, preservando `Button` como caso limpio; y `skills.ios.no-string-format` ya se detecta por AST al localizar `String(format:)` dentro de un `View`, preservando la interpolación Swift como caso limpio; y `skills.ios.no-foreach-indices` ya se detecta por AST al localizar `ForEach(...indices...)` dentro de un `View`, preservando `ForEach(items, id: \\.id)` como caso limpio; y `skills.ios.no-contains-user-filter` ya se detecta por AST al localizar flujos `filter { ... contains(query) }` dentro de un `View`, preservando `localizedStandardContains(query)` como caso limpio; y `skills.ios.no-geometryreader` ya se detecta por AST al localizar `GeometryReader` dentro de un `View`, preservando `containerRelativeFrame()` como caso limpio; y `skills.ios.no-font-weight-bold` ya se detecta por AST al localizar `fontWeight(.bold)` dentro de un `View`, preservando `bold()` como caso limpio; y `skills.ios.no-uiscreen-main-bounds` ya se detecta por AST al localizar `UIScreen.main.bounds` dentro de un `View`, preservando layout relativo como caso limpio; y `skills.ios.prefer-swift-testing` ya se detecta por AST al localizar suites XCTest-only con `import XCTest`, preservando `import Testing` + `@Test` como caso limpio; y `skills.ios.no-xctassert` ya se detecta por AST al localizar `XCTAssert*` y `XCTFail` dentro de suites modernas con `import Testing` o `@Test`, preservando `#expect` como caso limpio; y `skills.ios.no-xctunwrap` ya se detecta por AST al localizar `XCTUnwrap` dentro de suites modernas con `import Testing` o `@Test`, preservando `#require` como caso limpio; y `skills.backend.no-empty-catch` ya se detecta por AST en `apps/backend/**` al localizar `catch` vacíos, preservando `throw error` como caso limpio; y `skills.backend.no-console-log` ya se detecta por AST al localizar `console.log(...)` en runtime backend legacy, preservando `this.logger.log(...)` como caso limpio; y `skills.backend.avoid-explicit-any` ya se detecta por AST al localizar anotaciones explícitas `: any` en runtime backend legacy, preservando `unknown` como caso limpio; y `skills.backend.no-solid-violations` ya se detecta por AST al localizar clases backend con exceso de dependencias inyectadas en constructor, preservando servicios con dependencias enfocadas como caso limpio; y `skills.backend.no-god-classes` / `skills.frontend.no-god-classes` ya se detectan con payload semántico de God Class y cobertura backend/frontend en facts, registry, markdown y rule set. Nota de proceso: la desviación TDD quedó acotada a la sub-slice anterior (`skills.ios.no-foreach-indices`); esta nueva iteración también vuelve a rojo→verde puro. Decisión de la siguiente sub-slice: sigue sin aceptarse un segundo transplante mínimo por ahora; el foco inmediato permanece en seguir absorbiendo bundles modernos mediante detectores AST reales, ahora sobre el siguiente gap real de backend/frontend en el lock. El backlog externo de `SAAS`, `R_GO` y `Flux` sigue sin incidencias abiertas; la `🚧` interna permanece en `RG-P0-1`, ahora centrada en la siguiente heurística backend legacy sin reintroducir enforcement estático.)

Este documento es la **única fuente viva** de seguimiento interno del monorepo `ast-intelligence-hooks` (ver `AGENTS.md`). No sustituye el registro estructurado en el consumidor: `R_GO/docs/technical/08-validation/refactor/pumuki-integration-feedback.md`.

---

## Leyenda

- ✅ Cerrado
- 🚧 En construccion (maximo 1 en todo el documento)
- ⏳ Pendiente
- ⛔ Bloqueado (falta decisión de producto, proveedor IDE/CLI, o datos de consumidor)
- Convención hard de tracking: toda task viva o actualizada debe escribirse con el formato `[emoji] - tarea`.
- Regla hard: solo puede existir una tarea activa marcada con `🚧` en todo el documento.
- Regla hard: al cerrar una task, este MD debe actualizarse en el mismo turno para reflejar `[✅]`, `[⏳]` o `[⛔]` y activar la siguiente si aplica.
- Regla hard de cierre operativo: tarea hecha, comprobada que funciona y con UX/UI correcta implica cierre inmediato del ciclo; en ese mismo turno pasa a check verde `[✅]` y la siguiente tarea se marca en construcción. Este ciclo es obligatorio y no negociable.
- Regla hard operativa: cuando no haya bugs externos abiertos, el avance del backlog interno debe ser constante; la slice pesada activa la ejecuta el agente principal y las subtareas ligeras, preparatorias o de baja conflictividad se delegan de forma continua a subagentes, siempre sin abrir una segunda `🚧` en este MD.

---

## Fuentes canónicas enlazadas

| Fuente | Rol |
|--------|-----|
| [docs/validation/consumer-governance-ruralgo-informe-2026-04-12.md](docs/validation/consumer-governance-ruralgo-informe-2026-04-12.md) | Copia versionada en Pumuki del paquete de requisitos RuralGO (resumen + P0–P3). |
| [docs/product/USAGE.md](docs/product/USAGE.md) | Contrato MCP vs enforcement Git + clientes (IDE, CLI, extensión, agente). |
| [AGENTS.md](AGENTS.md) | Prohibición `--no-verify`, precedencia hooks consumidor vs viñeta legacy interna, prioridad MDs externos. |
| Informe íntegro (texto base del dueño) | El usuario puede pegar o archivar el MD completo en R_GO; las filas de abajo **trackean cada sección** de ese informe. |

---

## Compromisos que no son opcionales (informe §3, §8, §11)

| ID | Compromiso | Dónde queda fijado |
|----|-------------|-------------------|
| **RG-COMP-01** | Ningún agente / automatismo del repo usa `git commit --no-verify` ni `git push --no-verify` sin orden **por escrito** del dueño del repo donde se opera. | `AGENTS.md` — Prohibiciones explícitas. |
| **RG-COMP-02** | Enforcement perceptible = **Git hooks gestionados + CI con los mismos runners**; MCP es RPC bajo demanda, no “vigilancia por verde”. | `docs/product/USAGE.md` + tareas de producto RG-P0-* / RG-P1-*. |
| **RG-COMP-03** | Huecos IDE/MCP/paridad/worktree se tratan como **bugs o deuda de producto**, no como “el LLM no colabora”. | Este plan + issues / feedback R_GO. |

---

## Contexto de rescate 2026-04-13 — visión explícita del owner

Este rescate ya no se trata como una sucesión de refactors locales. La visión explícita del owner para Pumuki queda fijada aquí para que **no se pierda en el chat** ni se reinterprete en cada turno.

### Qué debe ser Pumuki

Pumuki debe comportarse como un **framework / sistema operativo de gobernanza para desarrollo con IA**, no como una colección de utilidades sueltas. La experiencia objetivo es:

- instalas Pumuki en cualquier repo;
- Pumuki aprende el contexto del repo y su contrato;
- gobierna al agente y al humano con la misma ley;
- bloquea cuando toca;
- explica por qué;
- propone siguiente acción;
- deja trazabilidad;
- y todo ello con feedback claro para cualquier dev del equipo.

### Capacidades que forman parte de la esencia de producto

Estas capacidades **no son “nice to have”**; forman parte del producto que se quiere rescatar y unificar:

- contexto continuo para el agente (`context update`, hints operativos por iteración, bootstrap);
- `ai_evidence` como verdad persistente;
- `ai_gate` como control central;
- `pre_flight`;
- `pre_write`;
- `pre_commit`;
- `pre_push`;
- notificaciones;
- GitFlow con bloqueo real;
- análisis de worktree para promover commits atómicos y troceo;
- MCPs / adaptadores que funcionen de verdad;
- menú interactivo potente, útil y con buena UX/ingeniería;
- integración SDD con OpenSpec sin fricción innecesaria.

### Restricciones no negociables del rescate

- **No** convertir este rescate en un bucle infinito de refactors.
- **No** perder la cadena moderna de iOS/Swift (`ios-enterprise-rules` + `swift-concurrency` + `swiftui-expert-skill`).
- **No** confundir la tríada hard Apple con la ampliación contextual reciente: `swift-testing-expert`, `core-data-expert`, `xcode-build-orchestrator`, `xcode-project-analyzer`, `xcode-build-fixer`, `xcode-compilation-analyzer`, `xcode-build-benchmark`, `spm-build-analysis` y `update-swiftui-apis` complementan la base y se activan por ámbito; no la sustituyen.
- **No** rebajar Android / Frontend / Backend a skills decorativas.
- **No** reconstruir Pumuki como producto duro de usar: el onboarding y el feedback claro son parte del valor.

### Decisión de viabilidad

La visión se considera **ambiciosa pero viable**. No se trata como “locura de producto”. La complejidad existe, pero está en rango razonable si se ejecuta por slices cerradas y con contrato de no-regresión.

---

## Matriz de rescate — mantener / rescatar / descartar / unificar

Esta matriz fija las decisiones de producto para que el rescate no dependa de memoria oral ni derive hacia otro refactor sin criterio.

| Tipo | Eje | Decisión fija | Evidencia base |
|------|-----|---------------|----------------|
| **Mantener** | Skills iOS/Swift modernas | Mantener como línea roja `ios-enterprise-rules` + `swift-concurrency` + `swiftui-expert-skill`; el rescate histórico no puede degradarlas. | `AGENTS.md`, `vendor/skills/ios-enterprise-rules`, `vendor/skills/swift-concurrency`, `vendor/skills/swiftui-expert-skill`. |
| **Mantener** | Stack iOS contextual reciente | Mantener la ampliación reciente de skills Apple como capa obligatoria por ámbito: testing (`swift-testing-expert`), persistencia (`core-data-expert`), build/Xcode (`xcode-build-orchestrator`, `xcode-project-analyzer`, `xcode-build-fixer`, `xcode-compilation-analyzer`, `xcode-build-benchmark`), SPM (`spm-build-analysis`) y actualización de APIs SwiftUI (`update-swiftui-apis`). No reemplaza la tríada hard; la complementa. | `AGENTS.md`, `docs/codex-skills/swift-testing-expert.md`, `docs/codex-skills/core-data-expert.md`, `~/.agents/skills/xcode-build-orchestrator`, `~/.agents/skills/xcode-project-analyzer`, `~/.agents/skills/xcode-build-fixer`, `~/.agents/skills/xcode-compilation-analyzer`, `~/.agents/skills/xcode-build-benchmark`, `~/.agents/skills/spm-build-analysis`, `~/.agents/skills/update-swiftui-apis`. |
| **Mantener** | Cobertura multi-plataforma | Mantener Android / Frontend / Backend como parte del core contractual de Pumuki, no como bundles secundarios. | `AGENTS.md`, `vendor/skills/android-enterprise-rules`, `vendor/skills/frontend-enterprise-rules`, `vendor/skills/backend-enterprise-rules`. |
| **Mantener** | Línea base moderna útil | Mantener lo que sí aporta valor hoy: adaptadores IDE-neutral, `governance truth`, receipts MCP, `status` / `doctor`, cadena `PRE_WRITE -> PRE_COMMIT/PRE_PUSH`, `policy-as-code`, SDD/OpenSpec. | `README.md`, `PUMUKI.md`, `docs/product/USAGE.md`, `integrations/lifecycle/*`, `integrations/mcp/*`, `integrations/git/*`. |
| **Rescatar** | Guardián del repo | Recuperar el carácter de **guardián real**: misma ley en hooks, CLI, MCP y menú; feedback claro y bloqueo perceptible. | `796ebd9` / tag `v5.6.0-IDE-HOOKS-WORKING` (README: “IDE Hooks Pre-Write Enforcement WORKING”), `7798a1b` / tag `v5.7.0` (“mandatory policy bundle gating”), `0973ef1` / tag `v6.0.0` (“rules digest implementation”); backlog RuralGo `PUMUKI-INC-071/072/073/076/077`. |
| **Rescatar** | Bloqueo temprano | Recuperar `fail fast / block early` como principio operativo real, no solo como copy de producto. | `README.md@v5.6.0-IDE-HOOKS-WORKING` + `scripts/hooks-system/infrastructure/cascade-hooks/pre-write-code-hook.js@v5.6.0-IDE-HOOKS-WORKING` (exit `2` bloquea escritura y el archivo no llega a disco). |
| **Rescatar** | Menú interactivo | Recuperar el menú como consola operativa principal: orientar, bloquear, remediar, enseñar, resumir y operar el repo. | `README.md`, `PUMUKI.md`, `package.json`, `scripts/framework-menu*`, histórico `bin/cli.js` / `scripts/hooks-system/bin/cli.js`. |
| **Rescatar** | Experiencia operativa | Recuperar señales de producto útiles: notificaciones, hints por worktree, sugerencias de commits atómicos, resumen final accionable. | Histórico `scripts/hooks-system/**`, `README.md` legacy, código actual de notificaciones y menu runtime. |
| **Descartar** | Advisory por defecto como norma de producto | No volver a aceptar la degradación a `advisory by default` como baseline general cuando el contrato del repo exige hard governance. | Secuencia histórica explícita `cfa04da` (`pre-write`), `a0a9f3c` (`sdd completeness`), `dccaeaa` (`heuristic promotion`), `52f3be1` (`skills`), `8e6b340` (`tdd-bdd`) y `a13c1ed` (`git atomicity`) degradando enforcement a advisory por defecto el 2026-03-13. |
| **Descartar** | Verde engañoso | Descartar cualquier superficie que mezcle “instalado” con “gobernanza efectiva” si el repo sigue parcialmente protegido. | RuralGo `PUMUKI-INC-070` y `PUMUKI-INC-073`; auditoría local en `status` / `doctor`. |
| **Descartar** | Dependencia mágica del IDE | Descartar la idea de que el enforcement puede depender de que el agente recuerde llamar manualmente a MCP o de wiring no garantizado por el cliente. | `AGENTS.md`, `docs/product/USAGE.md`, backlog RuralGo. |
| **Descartar** | Espejos de tracking compitiendo | Descartar cualquier retorno a múltiples MD internos como fuente de backlog. | `AGENTS.md` + este plan como única fuente viva. |
| **Unificar** | Contrato del repo | Unificar `AGENTS.md`, skills, GitFlow, tracking, hooks y política por ámbito en un contrato visible y resoluble por hooks/CLI/MCP/menú. | RuralGo `PUMUKI-INC-071`, `PUMUKI-INC-076`, `PUMUKI-INC-077`. |
| **Unificar** | Core loop | Unificar `instalación -> contexto -> validación -> implementación -> feedback -> commit/push -> cierre`. | Visión del owner + `RG-P1-9`. |
| **Unificar** | Superficies de producto | Unificar salida canónica entre menú, `status`, `doctor`, hooks y MCP para que hablen el mismo idioma de governance. | `RG-P1-7`, `RG-P1-8`, `RG-P1-9`. |
| **Unificar** | Modelo de remediación | Unificar “qué hacer ahora” en una única semántica operativa: bloqueos, hints, next action, remediation, bootstrap y cierre documental. | `README.md`, `PUMUKI.md`, `integrations/mcp/autoExecuteAiStart.ts`, `integrations/mcp/preFlightCheck.ts`, `integrations/git/runPlatformGateOutput.ts`. |

---

### Anclajes del grafo Git para `RG-P0-3`

- `v5.6.0-IDE-HOOKS-WORKING` / `796ebd9`
  - deja evidencia directa de guardián real: hooks IDE bloqueando antes de escribir, CLI operativa (`health`, `gitflow`, `evidence:update`, `watch`) y feedback perceptible.
- `v5.7.0` / `7798a1b`
  - consolida el policy bundle gating obligatorio como contrato, no como recomendación blanda.
- `v6.0.0` / `0973ef1`
  - cristaliza el rules digest como mecanismo moderno de autoridad y trazabilidad del enforcement.
- Ola de degradación `advisory by default` del 2026-03-13
  - `cfa04da`, `a0a9f3c`, `dccaeaa`, `52f3be1`, `8e6b340`, `a13c1ed`.
  - esta secuencia es la evidencia concreta de qué no debe volver a aceptarse como baseline del producto.
- Decisión de cierre de `RG-P0-3`
  - la matriz ya no depende de memoria oral: queda anclada a tags/commits reales, a superficies legacy concretas y a los bugs externos que demostraron qué valor seguía faltando en la línea moderna.

## Mapa informe RuralGO → entregables Pumuki (por sección)

| § Informe | Tema | Paquete de trabajo en este repo | IDs de tarea |
|-----------|------|----------------------------------|--------------|
| **§1** | Resumen ejecutivo (3 exigencias) | Política agente + producto enforcement | RG-COMP-01..03, RG-P0-1..3 |
| **§2** | Contexto técnico consumidor | Documentación de adaptadores + install | RG-P1-5, RG-DOC-ADAPTER |
| **§3** | Política dueño | Ya en AGENTS; vigilancia en CI/agent | RG-P0-2, RG-COMP-01 |
| **§4** | MCP IDE expectativa vs realidad | Contrato producto + salida hook obligatoria | RG-P1-3, RG-P3-9, USAGE |
| **§5** | `pumukiHooks` en `mcp.json` | Honestidad adaptador + matriz por cliente | RG-P1-5, RG-D-1..2 |
| **§6** | `.ai_evidence.json` semántica | Scope en JSON/salida + paridad con hooks | RG-P1-4, RG-P0-1, RG-P2-7 |
| **§7** | Pre-commit bloquea / inconsistencia | Worktree + remediation + umbrales | RG-P2-6, RG-P2-7, RG-C-1..2 |
| **§8** | `--no-verify` incidente | Agente + CI + heurística producto | RG-COMP-01, RG-P0-2, RG-F-1..2 |
| **§9** | Contradicción AGENTS vs dueño | Precedencia explícita (hecho en AGENTS) | ✅ documental |
| **§10** | Lista P0–P3 | Tabla detallada siguiente sección | RG-P0-* … RG-P3-* |
| **§11** | Cierre / feedback R_GO | Filas en `pumuki-integration-feedback.md` alineadas a IDs del plan (p. ej. **RG-OPS-01**, **PUMUKI-BDD-001**) | RG-OPS-01 |
| **§12** | Commits solo Markdown + parche evidencia | Fix producto o guía oficial sin variable oculta | RG-P2-12 |

---

## Backlog priorizado (informe §10) — detalle operativo

### P0 — Confianza e integridad

| ID | Estado | Petición RuralGO | Criterio de cierre (ingeniería) | Áreas de código / artefacto |
|----|--------|-------------------|--------------------------------|-----------------------------|
| **RG-P0-1** | ✅ | Paridad determinista entre superficie MCP y enforcement por hooks; eliminar la percepción “MCP no hace nada”. | Slice 1 ya cerrada en `6.3.97`: el adapter MCP activa `mcp_enterprise` por defecto y el comando exacto de `.pumuki/adapter.json` ya expone `ai_gate_check`, `pre_flight_check` y `auto_execute_ai_start` sin variables manuales. Slice 2 legacy ya validada: `v0-legacy-last` queda aislado en `legacy-chevrolet`, vuelve a instalar en worktrees modernos, bloquea `pre-commit`, `wrap-up` / `intent` vuelven a completar con superficie operativa viva tras los fixes `02ec140`, `9771b8a`, `401f87c`, `ab8df61`, `98dc46e`, `e2a3deb` y el ajuste actual de severidad total. El contraste con `freezer-current` ya descarta transplantes grandes (`integrations/gate`, `integrations/evidence`, `integrations/config`, lifecycle moderno completo) por riesgo de deformar el legacy. Primer transplante ya cerrado de verdad: `.pumuki/adapter.json` + ignore Git (`1f04809`) más corrección de semántica real del manifest para que `pre_commit` ejecute el hook bloqueante, `pre_push` ejecute validación GitFlow y `mcp.automation` arranque el servidor MCP usable (replay v3 en consumer con `Commit blocked`, `Git Flow validation passed` y `tools/list` devolviendo herramientas reales). Ajuste adicional: el hook legacy ahora bloquea también `MEDIUM` y `LOW`, cubierto por regresión ejecutable del hook. Decisión actual: no hay segundo transplante mínimo aceptado por ahora; las piezas pequeñas revisadas del `freezer-current` no son aditivas o remiten a runtime/tests fantasma sin scripts reales detrás. Criterio hard nuevo para cualquier injerto futuro desde `freezer-current`: solo se aceptan mejoras que entren por motor AST inteligente por nodos (`astNodeIds`, heurísticas dinámicas, compilación AUTO desde skills/reglas), priorizando Swift y el resto de lenguajes modernos; quedan vetadas las incorporaciones como reglas estáticas hardcodeadas o simples `.mdc` de contexto. Primer candidato identificado bajo ese criterio: `ios-swiftui-expert-guidelines` junto al snapshot `ios-swiftui-modernization-v2`, porque ya trae `heuristicRuleId` y mapping estable en `skillsDetectorRegistry.ts`. Primera, segunda, tercera, cuarta, quinta, sexta, séptima, octava y novena traducciones ya cerradas con TDD real: `skills.ios.no-navigation-view` ahora vive en el detector AST iOS legacy y el patrón estático de `NavigationView` se retira de `iOSModernPracticesRules.js`; `skills.ios.no-sheet-is-presented` ya se detecta por AST al localizar `.sheet(isPresented:)` dentro de un `View`, preservando `.sheet(item:)` como caso limpio y sin introducir reglas estáticas nuevas; `skills.ios.no-legacy-onchange` ya se detecta por AST al localizar `onChange(of:)` con cierre monádico dentro de un `View`, preservando el overload moderno de dos parámetros como caso limpio; `skills.ios.no-foreground-color` ya se detecta por AST al localizar `foregroundColor` dentro de un `View`, preservando `foregroundStyle` como caso limpio y sin introducir enforcement estático nuevo; `skills.ios.no-corner-radius` ya se detecta por AST al localizar `cornerRadius` dentro de un `View`, preservando `clipShape(.rect(cornerRadius:))` como caso limpio y sin introducir enforcement estático nuevo; `skills.ios.no-tab-item` ya se detecta por AST al localizar `tabItem` dentro de un `View`, preservando la nueva `Tab` API como caso limpio y sin introducir enforcement estático nuevo; `skills.ios.no-scrollview-shows-indicators` ya se detecta por AST al localizar `ScrollView(..., showsIndicators: ...)` dentro de un `View`, preservando `.scrollIndicators(.hidden)` como caso limpio y sin introducir enforcement estático nuevo; `skills.ios.no-observable-object` ya se detecta por AST al localizar clases que heredan `ObservableObject`, preservando `@Observable` como caso limpio; y `skills.ios.no-legacy-swiftui-observable-wrapper` ya se detecta por AST al localizar `@StateObject` o `@ObservedObject` dentro de structs `View`, preservando `@State` y `@Bindable` como casos limpios; y `skills.ios.no-passed-value-state-wrapper` ya se detecta por AST al localizar `@State` o `@StateObject` reenvueltos desde parámetros del `init`, preservando `@Binding` y el estado local propio como casos limpios; y `skills.ios.no-on-tap-gesture` ya se detecta por AST al localizar `onTapGesture` dentro de un `View`, preservando `Button` como caso limpio; y `skills.ios.no-string-format` ya se detecta por AST al localizar `String(format:)` dentro de un `View`, preservando la interpolación Swift como caso limpio. Siguiente sub-slice: `skills.ios.no-uiscreen-main-bounds` ya queda consolidada, `skills.ios.prefer-swift-testing` ya se detecta por AST al localizar suites XCTest-only con `import XCTest`, `skills.ios.no-xctassert` ya se detecta por AST al localizar `XCTAssert*` y `XCTFail` dentro de suites modernas con `import Testing` o `@Test`, y `skills.ios.no-xctunwrap` ya se detecta por AST al localizar `XCTUnwrap` dentro de suites modernas con `import Testing` o `@Test`, preservando `#require` como caso limpio. `skills.ios.no-wait-for-expectations` queda cerrada con detector estructural de función `async`: localiza `wait(for:)` y `waitForExpectations(timeout:)` dentro del cuerpo de tests async, preserva `await fulfillment(of:)` y no marca esperas síncronas legacy fuera del scope async. Siguiente heurística iOS prioritaria: `skills.ios.no-legacy-expectation-description`. | `integrations/lifecycle/adapter.templates.json`, `integrations/lifecycle/adapter.ts`, `integrations/lifecycle/artifacts.ts`, `legacy-chevrolet/scripts/hooks-system/**`, consumer repro `Flux_training`, artefactos `/tmp/legacy_adapter_*`, revisión de candidatos en `freezer-current/scripts/adapter-*.ts`, `scripts/__tests__/verify-adapter-hooks-runtime.test.ts`, `integrations/config/skillsRuleSet.ts`, `integrations/config/skillsMarkdownRules.ts`, `integrations/config/skillsCustomRules.ts`, `integrations/config/skillsDetectorRegistry.ts`, `integrations/config/skillsCompilerTemplates.ts`, `assets/rule-packs/ios-swiftui-modernization-v2.json`, `legacy-chevrolet/scripts/hooks-system/infrastructure/ast/ios/analyzers/iOSModernPracticesRules.js`, `legacy-chevrolet/scripts/hooks-system/infrastructure/ast/ios/detectors/ios-ast-intelligent-strategies.js`, `legacy-chevrolet/scripts/hooks-system/infrastructure/ast/ios/analyzers/__tests__/iOSASTIntelligentAnalyzer.spec.js`. |
| **RG-P0-2** | ✅ | Estrategia explícita ante `git commit --no-verify` (educación + detección CI si viable). | Runbook `docs/product/CONFIGURATION.md#git-hooks-and-no-verify` (límite Git, sin detección mágica, checklist branch protection). `doctor --deep`: check `hook-bypass-governance`; `doctor --parity`: línea recordatorio en `cli.ts`. | `integrations/lifecycle/doctor.ts`, `integrations/lifecycle/cli.ts`, `docs/product/CONFIGURATION.md`. |

### P1 — UX / observabilidad (sin depender del panel IDE)

| ID | Estado | Petición RuralGO | Criterio de cierre | Áreas |
|----|--------|------------------|-------------------|-------|
| **RG-P1-3** | ✅ | Resultado de gate (ALLOW/WARN/BLOCK) y **siguiente acción** concreta (equivalente a “panel” en terminal). | Línea canónica `NEXT: <acción>` en stdout junto a `[pumuki][block-summary]` (`printGateFindings`). | `integrations/git/runPlatformGateOutput.ts`, `integrations/git/__tests__/runPlatformGateOutput.test.ts`. |
| **RG-P1-4** | ✅ | Explicar por qué `matched_blocking_count: 0` con muchas reglas evaluadas (scope / sin match). | `operational_hints.scope_without_blocking_matches_note` + línea en `human_summary_lines` cuando `evaluated_count >= 3` y cero bloqueantes; doc `CONFIGURATION.md#snapshot-operational-hints`. | `integrations/evidence/operationalHints.ts`, `integrations/evidence/schema.ts`, tests. |

### P1 — `pumukiHooks` y clientes MCP

| ID | Estado | Petición RuralGO | Criterio de cierre | Áreas |
|----|--------|------------------|-------------------|-------|
| **RG-P1-5** | ✅ | Confirmar soporte por producto; si no existe, deprecar clave o opt-in. | `.cursor/mcp.json` sin `pumukiHooks` por defecto; opt-in `PUMUKI_ADAPTER_MERGE_PUMUKI_HOOKS=1` en `adapter.ts`; tests `adapter.test.ts`; matriz en `USAGE.md`. | `integrations/lifecycle/adapter.templates.json`, `integrations/lifecycle/adapter.ts`, `docs/product/USAGE.md`. |

### P0/P1 — Rescate de esencia + baseline skills 2026

| ID | Estado | Petición / decisión de producto | Criterio de cierre | Áreas |
|----|--------|---------------------------------|-------------------|-------|
| **RG-P0-3** | ✅ | Recuperar la **esencia histórica** de Pumuki usando el grafo Git como evidencia, no como nostalgia: identificar qué enforcement temprano, hooks, gate y contrato ya funcionaron de verdad y qué se degradó después. | Matriz versionada `mantener / rescatar / descartar` cerrada y anclada a `796ebd9` / `v5.6.0-IDE-HOOKS-WORKING`, `7798a1b` / `v5.7.0`, `0973ef1` / `v6.0.0` y a la secuencia `cfa04da` + `a0a9f3c` + `dccaeaa` + `52f3be1` + `8e6b340` + `a13c1ed` de degradación advisory. | `README.md` histórico, `scripts/hooks-system/**`, tags/commits Git, este plan. |
| **RG-P0-4** | ✅ | Declarar como **línea roja de no regresión** que el rescate de enforcement no puede degradar la cadena actual de skills Apple (`ios-enterprise-rules` + `swift-concurrency` + `swiftui-expert-skill`). | `status` / `doctor` / snapshot de governance exponen `apple_modern_baseline.required_by_contract`, `protected`, `effective_source` y bundles efectivos; la línea humana `Apple baseline:` deja visible que cualquier rescate histórico debe preservar la autoridad moderna Apple. | `integrations/lifecycle/governanceObservationSnapshot.ts`, `integrations/lifecycle/__tests__/status.test.ts`, `AGENTS.md`, `vendor/skills/ios-enterprise-rules`, `vendor/skills/swift-concurrency`, `vendor/skills/swiftui-expert-skill`. |
| **RG-P1-6** | ✅ | Reforzar **Android / Frontend / Backend** con mejores prácticas y baseline 2026 al mismo nivel contractual que iOS/Swift, sin perder cobertura multi-plataforma de Pumuki. | El snapshot de governance expone `platform_modern_baselines.{android,backend,frontend}` con `required_by_contract`, `protected`, `effective_source` y bundles efectivos; la línea humana `Platform baselines:` deja visible la baseline contractual 2026 para las cuatro plataformas. | `integrations/lifecycle/governanceObservationSnapshot.ts`, `integrations/lifecycle/__tests__/status.test.ts`, `vendor/skills/android-enterprise-rules`, `vendor/skills/frontend-enterprise-rules`, `vendor/skills/backend-enterprise-rules`. |
| **RG-P1-7** | ✅ | Hacer visible en CLI/hooks/MCP qué baseline de skills por plataforma está gobernando realmente el repo actual, no solo que “hay skills instaladas”. | `status` / `doctor` / snapshot de governance ya distinguen `required_by_contract`, `repo_tree_detected`, `governing_now`, `required_lock_covered`, `effective_lock_covered`, `missing_bundles` y `effective_source` por plataforma; la línea humana `Platform baselines:` deja visible si cada baseline está gobernando de verdad o solo declarada. | `integrations/lifecycle/governanceObservationSnapshot.ts`, `integrations/lifecycle/__tests__/status.test.ts`, `integrations/config/skillsEffectiveLock.ts`, `integrations/gate/evaluateAiGate.ts`. |
| **RG-P1-8** | ✅ | Recuperar el **menú interactivo** como superficie principal de operación, con potencia real de ingeniería y buena UI/UX, usando lo mejor del menú legacy y del actual. | Auditoría comparada `legacy vs actual` cerrada y ownership final resuelto: `Consumer` abre con `Governance truth` + `Governance next action`, conserva solo los **gates primarios** (`1-4`) y `Exit`, y elimina snapshots/exportes secundarios del flujo principal; `Advanced` queda consolidado como **toolkit secundario** por dominios (`Engineering Gates`, `Diagnostics & Support`, `Legacy Audit Toolkit`, `Maintenance & Skills`, `Validation`, `System`). La duplicidad semántica residual entre ambas superficies queda eliminada. | `scripts/framework-menu-consumer-runtime-menu.ts`, `scripts/framework-menu-layout-data.ts`, `scripts/framework-menu-advanced-view-lib.ts`, `scripts/framework-menu-consumer-actions-lib.ts`, `scripts/framework-menu-consumer-runtime-actions.ts`, `scripts/__tests__/framework-menu-consumer-runtime-menu.test.ts`, `scripts/__tests__/framework-menu-consumer-runtime-actions.test.ts`, `scripts/__tests__/framework-menu-layout-resolve.test.ts`, `scripts/__tests__/framework-menu-layout-coverage.test.ts`, `scripts/__tests__/framework-menu-consumer-actions.test.ts`, `scripts/__tests__/framework-menu-advanced-view-menu.test.ts`, `bin/cli.js` histórico, `scripts/hooks-system/bin/cli.js` histórico, tracking. |
| **RG-P1-9** | ✅ | Unificar **context update**, `ai_evidence`, `ai_gate`, stages (`pre_flight`, `pre_write`, `pre_commit`, `pre_push`), notificaciones, worktree hints y SDD/OpenSpec dentro de un **core loop** coherente de producto. | El mapa operativo actual del loop queda documentado fase por fase (`arranque -> contexto -> validación -> ejecución -> feedback -> commit/push -> cierre`); la salida humana mínima compartida (`core loop`) se reutiliza en menú `Consumer` y CLI humana (`status` / `doctor`); la tercera slice extiende ese vocabulario a `ai_gate_check` y al bloque de salida de hooks/gate; una cuarta slice deja un `closeout` canónico compartido (`Next action / Instruction / Action detail / Command`) entre lifecycle, hooks y MCP (`pre_flight_check`, `auto_execute_ai_start`, `ai_gate_check`, `runPlatformGateOutput`); una quinta slice hace que `gate.blocked` y las notificaciones consuman ya ese `closeout` estructurado autoritativo, dejando `remediation` como compatibilidad/fallback; una sexta slice hace que `enterpriseServer` reutilice esa misma autoridad también en sus ramas propias de payload (`MCP_ENTERPRISE_EXPERIMENTAL_DISABLED` y `SDD_VALIDATION_ERROR`); y la auditoría final confirma que no queda ninguna otra superficie enterprise del loop con `closeout` derivado fuera del helper canónico. | `PUMUKI-RESET-MASTER-PLAN.md`, `integrations/lifecycle/{cli,coreLoopSummary,governanceNextAction}.ts`, `scripts/framework-menu-consumer-runtime-menu.ts`, `integrations/git/{stageRunners,runPlatformGateOutput}.ts`, `integrations/evidence/{readEvidence,writeEvidence}.ts`, `integrations/notifications/**`, `integrations/mcp/{aiGateCheck,preFlightCheck,autoExecuteAiStart,enterpriseServer}.ts`, docs de producto. |

### P2 — Worktree hygiene

| ID | Estado | Petición RuralGO | Criterio de cierre | Áreas |
|----|--------|------------------|-------------------|-------|
| **RG-P2-6** | ✅ | Calibrar `block_threshold` vs PR monorepo o guiar troceo sin fricción. | Mensajes de higiene accionables (`git add` por prefijo, `PUMUKI_GATE_SCOPE_PATH_PREFIXES`, `PUMUKI_PREWRITE_WORKTREE_*`) + enlace `CONFIGURATION.md#pending_changes-vs-evidence-only-lines`; tests `evaluateAiGate.test.ts`. | `integrations/gate/evaluateAiGate.ts`, `integrations/gate/remediationCatalog.ts`, `docs/product/CONFIGURATION.md`. |
| **RG-P2-7** | ✅ | Evitar que el flujo de evidencia empeore `pending_changes` opacamente. | `captureRepoState` expone `pending_changes_excluding_evidence_path` y `pending_changes_evidence_only_lines`; higiene usa el excluido salvo `PUMUKI_WORKTREE_HYGIENE_INCLUDE_EVIDENCE_FILE=1`; tests `repoState.test.ts` + `evaluateAiGate.test.ts`. | `integrations/evidence/repoState.ts`, `integrations/evidence/schema.ts`, `evaluateAiGate.ts`, `CONFIGURATION.md`. |
| **RG-P2-8** | ✅ | Promover WARN→BLOCK en diff bajo política enterprise estricta (opt-in). | `PUMUKI_ENTERPRISE_STRICT_WARN_AS_BLOCK=1` endurece `blockOnOrAbove` a como mucho **WARN** en `resolvePolicyForStage` (default, `skills.policy`, hard-mode); tests `stagePolicies-config-and-severity.test.ts`. | `integrations/gate/stagePolicies.ts`, `docs/product/CONFIGURATION.md`. |
| **RG-P2-12** | ✅ | **§12 informe:** commits solo `.md` + evidencia trackeada. | Política por defecto conservada (no auto-stage en solo-doc); documentación canónica `CONFIGURATION.md#documentation-only-commits-and-tracked-evidence`; stderr `[pumuki][evidence-sync]` enmarcado como política de producto + enlace; remediación en ruta de error `git add`; tests `stageRunners.test.ts` (stderr + quiet). | `integrations/git/stageRunners.ts`, `docs/product/CONFIGURATION.md`, `docs/product/USAGE.md`, `integrations/git/__tests__/stageRunners.test.ts`. |

### P3 — MCP “automático”

| ID | Estado | Petición RuralGO | Criterio de cierre | Áreas |
|----|--------|------------------|-------------------|-------|
| **RG-P3-9** | ✅ | Contrato: qué eventos disparan tools sin invocación manual (si protocolo + cliente lo permiten). | Bullets bajo OpenSpec en `docs/product/USAGE.md` (MCP “automático”: sin disparadores estándar; tools bajo demanda). | `docs/product/USAGE.md`. |

### Operativa / trazabilidad

| ID | Estado | Descripción | Criterio |
|----|--------|-------------|----------|
| **RG-OPS-01** | ✅ | Al cerrar hitos, reflejar IDs en `pumuki-integration-feedback.md` del consumidor cuando el equipo formalice correspondencia. | Checklist §11 en `docs/validation/consumer-governance-ruralgo-informe-2026-04-12.md` + fila **2026-04-05 — RG-OPS-01** en `R_GO/docs/technical/08-validation/refactor/pumuki-integration-feedback.md` (enlaces a `PUMUKI-RESET-MASTER-PLAN.md` e informe versionado en GitHub). |

### Documentación mínima obligatoria (no sustituye código)

| ID | Estado | Descripción |
|----|--------|---------------|
| **RG-DOC-ADAPTER** | ✅ | Matriz “cliente MCP → ¿ejecuta `pumukiHooks`? → fuente” en informe versionado o CONFIGURATION. | Tabla ancla `docs/product/USAGE.md#matriz-mcp--pumukihooks-por-cliente` + referencia en `CONFIGURATION.md`. |

---

## Orden de ejecución recomendado (ingeniería)

1. **RG-P0-1** primero (desbloquea percepción “MCP no hace nada” / paridad con hooks).
2. **RG-P0-3** + **RG-P0-4** antes de rediseñar enforcement: rescatar esencia histórica con evidencia y fijar no-regresión iOS/Swift moderna.
3. **RG-P1-8** + **RG-P1-9** para fijar el core loop y la experiencia operativa principal (menú + flujo gobernado de producto).
4. **RG-P1-6** + **RG-P1-7** para que el contrato multi-plataforma quede equilibrado y visible, no centrado solo en una plataforma.
5. **RG-P1-3** + **RG-P1-4** + ampliación **remediationCatalog** (observabilidad en terminal).
6. **RG-P2-6**, **RG-P2-7**, **RG-P2-12** (worktree + evidencia + flujo markdown-only).
7. **RG-P1-5** (adaptador honesto).
8. **RG-P2-8** (enterprise strict opt-in).
9. **RG-P0-2** + **RG-F-*** (bypass / CI — solo si diseño cerrado).
10. **RG-P3-9** + **RG-OPS-01** + **RG-DOC-ADAPTER** (cierre de contrato y espejo consumidor).

**Verificación habitual:** `npm test` con foco `integrations/git`, `integrations/gate`, `integrations/mcp`, `integrations/lifecycle`, `integrations/evidence`.

**Ramas:** `refactor/*` o `feature/*` desde `develop` según GitFlow del repo.

---

## Ruta de ejecución paso a paso (para no dispersarse)

Esta ruta es la secuencia operativa a seguir. Si una iteración nueva no cae claramente en uno de estos pasos, se considera riesgo de dispersión.

1. **Paso 0 — Congelar la visión**
   - Mantener este plan como fuente viva.
   - No abrir nuevos frentes fuera de las IDs activas.

2. **Paso 1 — Rescate de esencia**
   - Completar matriz `mantener / rescatar / descartar`.
   - Anclar decisiones a tags y commits reales del grafo Git.

3. **Paso 2 — Core loop de producto**
   - Definir y documentar el loop canónico:
     `instalación -> contexto -> validación -> implementación -> feedback -> commit/push -> cierre`
   - Ubicar dentro del loop: menú, evidence, gate, notifications, OpenSpec/SDD, MCP, hooks.

### Mapa canónico actual del core loop (`RG-P1-9` · slice 1)

Esta tabla fija el **estado actual real** del producto antes de unificarlo. Su función no es vender “loop ya cerrado”, sino impedir otra iteración difusa: a partir de aquí, cualquier cambio de `RG-P1-9` debe decir qué fase toca, qué ownership mueve y qué salida canónica sustituye.

| Fase del loop | Qué ocurre hoy | Ownership actual | Evidencia viva |
|---------------|----------------|------------------|----------------|
| **1. Arranque** | La CLI lifecycle orquesta entrada de comandos (`install`, `bootstrap`, `status`, `doctor`, `watch`, `policy reconcile`, `audit`) y actúa como fachada principal del producto. | `integrations/lifecycle/cli.ts` | `runLifecycleCli()`, wiring de `install/bootstrap/status/doctor/watch/policyReconcile/audit`. |
| **2. Contexto** | El repo resuelve contrato/gobernanza/skills/política/evidence antes de decidir el siguiente paso. | `status`, snapshots lifecycle, `evaluateAiGate`, lectura de evidence | `integrations/lifecycle/status.ts`, `integrations/lifecycle/governanceObservationSnapshot.ts`, `integrations/policy/policyAsCode.ts`, `integrations/evidence/readEvidence.ts`. |
| **3. Validación** | La ley operativa se decide por stage/policy y por AI gate; MCP reutiliza esa misma semántica en modo dry-run o alineado. | `stagePolicies`, `evaluateAiGate`, `aiGateCheck` | `integrations/gate/stagePolicies.ts`, `integrations/gate/evaluateAiGate.ts`, `integrations/mcp/aiGateCheck.ts`. |
| **4. Ejecución** | Los runners de stage ejecutan el gate real sobre `PRE_COMMIT`, `PRE_PUSH` y `CI`, incluyendo atomicidad Git, ranges y refresh de evidence. | `integrations/git/stageRunners.ts`, `runPlatformGate` | `runPreCommitStageRunner`, `runPrePushStageRunner`, `runCiStageRunner`, `integrations/git/runPlatformGate.ts`. |
| **5. Feedback** | El sistema devuelve resumen, bloqueo, remediation y next action por terminal, menú, notificaciones y MCP. | outputs lifecycle + notifications + menú + MCP | `integrations/notifications/emitAuditSummaryNotification.ts`, `scripts/framework-menu-*`, `integrations/mcp/enterpriseServer.ts`. |
| **6. Commit / Push** | Los hooks Git gestionados encadenan el enforcement baseline y garantizan que `pre-write` corra antes de `pre-commit` / `pre-push`. | `hookManager`, bloque gestionado de hooks | `integrations/lifecycle/hookManager.ts`, `integrations/lifecycle/hookBlock.ts`, contrato en `AGENTS.md`. |
| **7. Cierre** | El loop persiste evidence, receipts y estado de sesión/seguimiento para la siguiente iteración y para superficies de lectura (`status`, `doctor`, MCP, menú). | evidence + loop session + receipts | `integrations/evidence/writeEvidence.ts`, `integrations/mcp/aiGateReceipt.ts`, `integrations/lifecycle/loopSessionStore.ts`, `readEvidence.ts`. |

#### Decisión de esta slice

- El loop **ya existe**, pero todavía está repartido entre varias superficies.
- El problema de `RG-P1-9` ya no es descubrir piezas, sino **unificar semántica y salida canónica** entre ellas.
- La siguiente slice debe atacar esto en orden:
  1. definir qué salida humana es la autoridad para cada fase;
  2. hacer que menú / `status` / `doctor` / hooks / MCP reciclen esa misma salida;
  3. dejar una única semántica para `next action`, remediation y cierre.

#### Slice 2 cerrada: salida humana mínima compartida (`core loop`)

Esta slice ya deja una primera convergencia visible y reutilizable:

- existe una salida humana compacta del loop con `Loop start`, `Loop context`, `Loop validation` y `Loop feedback`;
- esa salida nace de la misma verdad que ya alimenta `governanceObservation` + `governanceNextAction`;
- `status`, `doctor` y el menú `Consumer` ya enseñan esa capa sin inventar vocabularios distintos;
- el siguiente trabajo de `RG-P1-9` deja de ser nombrar el loop y pasa a extender esa misma semántica a hooks y MCP.

#### Evidencia de la slice 2

- helper compartido:
  - `integrations/lifecycle/coreLoopSummary.ts`
- superficies conectadas:
  - `integrations/lifecycle/cli.ts`
  - `scripts/framework-menu-consumer-runtime-menu.ts`
- regresión mínima:
  - `integrations/lifecycle/__tests__/coreLoopSummary.test.ts`
  - `scripts/__tests__/framework-menu-consumer-runtime-menu.test.ts`

#### Slice 3 cerrada: semántica común también en hooks y MCP

Esta slice cierra la primera convergencia fuera de lifecycle/UI:

- `ai_gate_check` ya no devuelve solo `message` + `warnings` + `auto_fixes`; ahora también expone un bloque `core_loop` con el mismo vocabulario mínimo de `validation / feedback / command`;
- la salida de bloqueo del gate (`runPlatformGateOutput`) ya imprime esas mismas líneas canónicas dentro del `block-summary`, en vez de dejar hooks con un dialecto separado;
- el loop empieza a hablar el mismo idioma en `status`, `doctor`, menú `Consumer`, MCP `ai_gate_check` y feedback de hooks/gate.

#### Evidencia de la slice 3

- helper compartido ampliado:
  - `integrations/lifecycle/coreLoopSummary.ts`
- MCP alineado:
  - `integrations/mcp/aiGateCheck.ts`
- feedback de hooks/gate alineado:
  - `integrations/git/runPlatformGateOutput.ts`
- regresión mínima:
  - `integrations/lifecycle/__tests__/coreLoopSummary.test.ts`
  - `integrations/mcp/__tests__/aiGateCheck.test.ts`
  - `integrations/git/__tests__/runPlatformGateOutput.test.ts`

#### Slice 4 cerrada: closeout canónico compartido

Esta slice ya no cambia el vocabulario del loop: fija el ownership del **closeout**.

- `governanceNextAction` deja de ser una excepción de lifecycle y pasa a reciclar el mismo helper de closeout que usan las demás superficies;
- `pre_flight_check` y `auto_execute_ai_start` ya no se limitan a devolver `reason_code` + `next_action`, sino que también adjuntan un bloque `core_loop_closeout`;
- `ai_gate_check` y el `block-summary` de hooks/gate ya enseñan el mismo cierre canónico con `Next action / Instruction / Action detail / Command`;
- el problema residual ya no es “qué texto usar”, sino **qué superficie debe ser la autoridad final** para ese closeout y cómo propagarla a notificaciones y payloads de servidor.

#### Evidencia de la slice 4

- helper compartido ampliado:
  - `integrations/lifecycle/coreLoopSummary.ts`
- lifecycle alineado:
  - `integrations/lifecycle/governanceNextAction.ts`
- MCP alineado:
  - `integrations/mcp/preFlightCheck.ts`
  - `integrations/mcp/autoExecuteAiStart.ts`
  - `integrations/mcp/aiGateCheck.ts`
- hooks/gate alineados:
  - `integrations/git/runPlatformGateOutput.ts`
- regresión mínima:
  - `integrations/mcp/__tests__/preFlightCheck.test.ts`
  - `integrations/mcp/__tests__/autoExecuteAiStart.test.ts`
  - `integrations/mcp/__tests__/aiGateCheck.test.ts`
  - `integrations/git/__tests__/runPlatformGateOutput.test.ts`

#### Slice 5 cerrada: closeout autoritativo también en notificaciones

Esta slice ya no cambia el vocabulario ni el ownership del closeout humano; hace llegar esa misma autoridad a la última superficie visible que todavía dependía de remediaciones derivadas.

- `gate.blocked` ya no transporta solo `reason` + `remediation`; ahora puede adjuntar un `closeout` estructurado con `phase / action / confidencePct / reasonCode / instruction / nextAction`;
- `stageRunners` resuelve ese `closeout` desde el mismo catálogo de governance que usa el resto del loop y lo propaga al emitir la notificación de bloqueo;
- los payloads y diálogos de notificación ya priorizan `instruction + next action` del `closeout` canónico, dejando `remediation` únicamente como compatibilidad/fallback;
- el problema residual ya no vive en las notificaciones de bloqueo, sino en decidir qué payloads de servidor y superficies enterprise deben delegar también en esta autoridad para que no sobreviva ningún closeout paralelo.

#### Evidencia de la slice 5

- contrato de evento ampliado:
  - `scripts/framework-menu-system-notifications-event-types.ts`
- emisión alineada:
  - `integrations/notifications/emitAuditSummaryNotification.ts`
  - `integrations/git/stageRunners.ts`
- consumo alineado:
  - `scripts/framework-menu-system-notifications-remediation.ts`
  - `scripts/framework-menu-system-notifications-payloads-blocked.ts`
- regresión mínima:
  - `scripts/__tests__/framework-menu-system-notifications-remediation.test.ts`
  - `scripts/__tests__/framework-menu-system-notifications-payloads.test.ts`
  - `scripts/__tests__/framework-menu-system-notifications-types.test.ts`
  - `integrations/notifications/__tests__/emitAuditSummaryNotification.test.ts`
  - `integrations/git/__tests__/stageRunners.test.ts`

#### Slice 6 cerrada: payloads del servidor enterprise alineados

Esta slice cierra la última duplicidad clara dentro del propio servidor enterprise.

- `enterpriseServer` ya no devuelve ramas propias con `next_action` aislado cuando el namespace experimental está apagado o cuando un tool crítico queda bloqueado por la guardia SDD;
- esas dos rutas (`MCP_ENTERPRISE_EXPERIMENTAL_DISABLED` y `SDD_VALIDATION_ERROR` en guard) construyen ahora un `core_loop_closeout` con la misma autoridad canónica que el resto del sistema;
- el servidor mantiene compatibilidad con `reason_code / instruction / next_action`, pero deja de ser una excepción semántica dentro del namespace enterprise.

#### Evidencia de la slice 6

- servidor enterprise alineado:
  - `integrations/mcp/enterpriseServer.ts`
- regresión mínima:
  - `integrations/mcp/__tests__/enterpriseServer.test.ts`

#### Slice 7 cerrada: auditoría final de superficies enterprise

Esta slice no añade comportamiento nuevo; verifica cierre real del trabajo.

- la auditoría final sobre `integrations/mcp/**`, `integrations/git/**`, `integrations/notifications/**` y `scripts/framework-menu-system-notifications*` confirma que las superficies enterprise del loop ya consumen la misma autoridad canónica de closeout;
- los `next_action` que siguen existiendo en `cliSdd` o en comandos experimentales/analytics de lifecycle no forman otra excepción enterprise del loop unificado, sino una deuda separada de CLI/experimental que queda fuera de `RG-P1-9`;
- con eso, `RG-P1-9` deja de estar en fase de slices abiertas y puede cerrarse como convergencia real del core loop de producto.

#### Evidencia de la slice 7

- auditoría de superficies enterprise:
  - `integrations/mcp/enterpriseServer.ts`
  - `integrations/mcp/{aiGateCheck,preFlightCheck,autoExecuteAiStart}.ts`
  - `integrations/git/{stageRunners,runPlatformGateOutput}.ts`
  - `integrations/notifications/emitAuditSummaryNotification.ts`
  - `scripts/framework-menu-system-notifications-*`
- hallazgos fuera de alcance enterprise:
  - `integrations/lifecycle/cliSdd.ts`
  - `integrations/lifecycle/__tests__/cli.test.ts`

4. **Paso 3 — Baseline por plataforma**
   - Blindar iOS/Swift moderno como no-regresión.
   - Auditar Android / Frontend / Backend y subirlos al mismo nivel contractual.

5. **Paso 4 — Primera slice de implementación real**
   - Elegir una slice pequeña que devuelva autoridad clara a Pumuki.
   - La slice debe mejorar comportamiento percibido, no solo estructura interna.

6. **Paso 5 — Verificación y cierre**
   - Tests.
   - Validación en consumidores si aplica.
   - Actualización del backlog externo y de este plan.

Regla de STOP:

- Si una propuesta no devuelve autoridad, claridad o cohesión de producto, no entra.
- Si una propuesta es “otro refactor más” sin ganancia perceptible de comportamiento, no entra.

---

## Primera slice recomendada (cuando el trabajo pase a `develop`)

La primera slice real de implementación debe ser **pequeña, perceptible y centrada en comportamiento**. La recomendación actual es:

### Slice S1 — Consola de gobernanza unificada

Objetivo:

- hacer visible el **contrato efectivo del repo**;
- eliminar ambigüedad entre “instalado” y “gobernanza efectiva”;
- y convertir el menú en la primera consola operativa de ese contrato.

Resultado esperado:

- `status`, `doctor`, hooks y menú muestran el mismo bloque canónico:
  - contrato del repo;
  - governance efectiva;
  - plataformas activas y bundles obligatorios;
  - SDD/OpenSpec;
  - evidence outcome;
  - branch/GitFlow;
  - siguiente acción.
- el menú deja de ser solo un lanzador y pasa a ser la **entrada principal** al estado real del repo.

Límites de la slice:

- **No** reescribir todo el menú.
- **No** abrir rediseño completo de MCP.
- **No** tocar skills de plataforma salvo para exponer contrato efectivo o corregir huecos documentales mínimos.

Definición de done:

- misma semántica visible entre `status`, `doctor` y menú para contrato/gobernanza;
- tests de regresión de salida y wiring;
- sin degradar iOS/Swift moderno ni cobertura multi-plataforma;
- y actualización del backlog externo si el comportamiento resuelve parte medible de `PUMUKI-INC-071/073/076/077`.

---

## Inventario inicial de superficies para la Slice S1

Este inventario traduce la Slice S1 a superficies concretas del producto, para que el trabajo posterior no derive en “refactor del menú” sin alcance acotado.

### Superficies actuales que entran en S1

| Superficie | Estado actual observado | Papel en S1 |
|------------|-------------------------|-------------|
| `status` | Ya expone `governance truth` y separa estado técnico de parte del estado de governance. | Debe convertirse en una de las fuentes canónicas del bloque de contrato/gobernanza. |
| `doctor` | Ya expone `governance truth` y puede fallar por governance no verde. | Debe compartir semántica visible con `status` y con el menú. |
| Hooks (`PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`) | Ya tienen summaries, remediation y cadena gestionada. | Deben hablar el mismo idioma que menú/CLI en contrato, branch, evidence y next action. |
| Menú `Consumer` | Hoy es el arranque por defecto y expone `1/2/3/4` como flows canónicos con preflight. | Debe pasar de shell de opciones a consola operativa principal del contrato efectivo del repo. |
| Menú `Advanced` | Sigue exponiendo toolkit amplio y ayudas contextuales. | Debe mantenerse como superficie secundaria; no debe definir por sí sola la semántica canónica de governance. |

### Evidencia concreta del menú actual

- Entry-point actual: `bin/pumuki-framework.js -> scripts/framework-menu.cli.ts -> runFrameworkMenu()`.
- El menú arranca en modo `Consumer` por defecto y permite alternar a `Advanced`.
- Las opciones `1/2/3/4` son hoy el shell canónico de gate consumer con preflight.
- Las opciones `11/12/13/14` corren motor sin preflight y escriben `.ai_evidence.json` en runs `PRE_COMMIT`.
- Las opciones `5/6/7/9` y `28/29/30/32` siguen marcadas como legacy/read-only diagnostics fuera del baseline de producto.

### Auditoría comparada `legacy vs actual` del menú

| Decisión | Elemento | Lectura comparada | Decisión operativa |
|----------|----------|-------------------|--------------------|
| **Mantener** | Menú `Consumer` como arranque por defecto | El menú actual ya acierta al abrir por `Consumer` y reservar `Advanced` como toolkit secundario. | Mantener `Consumer` como puerta de entrada principal y reforzarlo con estado contractual antes que más opciones. |
| **Mantener** | Agrupación temática del menú actual | La separación `Gates / Diagnostics / Maintenance / Validation / System` da orden real y evita caos de toolkit plano. | Mantener la agrupación actual como base de UX; no volver a una lista monolítica. |
| **Rescatar** | Sensación de “guardián vivo” del legacy | El legacy tenía `health`, `watch`, `gitflow`, `intent` y snapshots rápidos que daban presencia operativa inmediata. | Rescatar ese tono de consola viva, pero integrándolo dentro del bloque canónico y no como comandos sueltos sin jerarquía. |
| **Rescatar** | Comandos cortos de alto valor | El legacy ofrecía verbos claros y memorables (`health`, `gitflow`, `intent`, `evidence:update`) con retorno rápido. | Rescatar la inmediatez operativa de esos verbos como acciones de primer nivel o accesos directos dentro de `Consumer`. |
| **Descartar** | Mezcla del toolkit legacy como baseline de producto | El legacy combinaba auditoría, watch, evidencia e intención sin separar claramente contrato, gate y soporte. | Descartar cualquier intento de reinyectar todo el toolkit histórico como baseline obligatoria del menú moderno. |
| **Descartar** | Menú como mero lanzador de utilidades | Tanto el legacy como parte del menú actual caen a veces en “lista de comandos” antes que en consola de gobierno del repo. | Descartar el patrón de lanzador puro: el menú debe explicar primero el estado del repo y después ejecutar. |
| **Unificar** | Vocabulario visible entre `status` / `doctor` / hooks / menú | El motor actual ya tiene la semántica buena, pero el menú todavía no la pone en primer plano. | Unificar el bloque canónico al arranque del menú `Consumer` con el mismo lenguaje de governance efectiva y siguiente acción. |
| **Unificar** | Relación `Consumer` / `Advanced` | Hoy la relación existe, pero sigue siendo más de navegación que de autoridad de producto. | `Consumer` debe gobernar el flujo principal; `Advanced` debe quedar como caja de herramientas secundaria sin duplicar semántica. |

### Patrones legacy que merece rescatar

| Patrón legacy | Valor de producto | Fuente histórica |
|---------------|-------------------|------------------|
| `health` / snapshot rápido del estado del repo | Da sensación de “sistema vivo” y de guardián activo. | `scripts/hooks-system/bin/cli.js@v5.6.0-IDE-HOOKS-WORKING` |
| `gitflow` como comando explícito | Refuerza que el flujo de ramas no es decorativo. | `scripts/hooks-system/bin/cli.js@v5.6.0-IDE-HOOKS-WORKING` |
| `evidence:update` / `evidence:full-update` | Refuerza la idea de evidencia como verdad operativa, no como archivo opaco. | `scripts/hooks-system/bin/cli.js@v5.6.0-IDE-HOOKS-WORKING` |
| `watch` / guard / monitor | Refuerza presencia continua y feedback operativo. | `scripts/hooks-system/bin/cli.js@v5.6.0-IDE-HOOKS-WORKING`, `scripts/hooks-system/application/services/guard/*` |
| `intent` / contexto explícito | Conecta la intención humana con el loop de gobernanza. | `scripts/hooks-system/bin/cli.js@v5.6.0-IDE-HOOKS-WORKING` |

### No objetivos de S1

- No reintroducir todo el toolkit legacy como baseline obligatorio.
- No mezclar los flujos phase5 / startup triage / support bundles con la semántica canónica del gate.
- No convertir opciones de diagnóstico legacy en equivalentes de governance efectiva.

### Criterio de diseño para S1

- `Consumer` debe representar el **camino principal** del producto.
- `Advanced` debe quedar como caja de herramientas secundaria.
- `status`, `doctor`, hooks y menú deben compartir el mismo vocabulario:
  - contrato del repo;
  - governance efectiva;
  - bundles/plataformas activas;
  - branch/GitFlow;
  - evidence;
  - siguiente acción.

---

## Bloque canónico de gobernanza para S1

La Slice S1 no consiste en “embellecer salida”, sino en fijar un bloque canónico de producto que cualquier superficie pueda renderizar con distinta presentación pero con la **misma semántica**.

### Campos obligatorios del bloque

| Campo | Qué debe responder | Disponibilidad actual |
|-------|--------------------|-----------------------|
| `repo_contract_effective` | ¿Cuál es el contrato efectivo del repo que gobierna este turno? | **Gap** — hoy hay `contract_surface`, pero no contrato resuelto completo (`PUMUKI-INC-071`). |
| `governance_effective` | ¿El repo está realmente en `green`, `attention` o `blocked`? | **Disponible parcialmente** en `status` / `doctor`. |
| `platform_bundles_effective` | ¿Qué plataformas y bundles obligatorios aplican de verdad aquí? | **Gap** — visible de forma indirecta, no como contrato resuelto (`RG-P1-7`). |
| `gitflow_effective` | ¿La rama actual cumple naming/flujo o está solo en hint? | **Gap** — hoy hay `protected_branch_hint`, pero no enforcement semántico completo (`PUMUKI-INC-076`). |
| `sdd_effective` | ¿SDD/OpenSpec está apagado, advisory o strict, y la sesión es válida? | **Disponible parcialmente** en `status` / `doctor`. |
| `evidence_effective` | ¿Qué outcome tiene la evidencia y qué severidad real aporta al gate? | **Disponible parcialmente**; falta promoción declarativa por repo (`PUMUKI-INC-074`). |
| `prewrite_effective` | ¿Existe bloqueo previo a escritura real o solo stage advisory/hook chain? | **Gap** — hoy PRE_WRITE existe, pero no como pre-edit universal (`PUMUKI-INC-072`). |
| `next_action` | ¿Qué debe hacer ahora el dev/agente para salir del estado actual? | **Disponible parcialmente** en hooks/MCP; no unificado en todas las superficies. |

### Salida humana mínima esperada

Toda superficie canónica (`status`, `doctor`, hooks, menú Consumer) debería poder responder, en este orden:

1. `Contract:` contrato efectivo del repo.
2. `Governance:` `GREEN` / `ATTENTION` / `BLOCKED`.
3. `Platforms:` plataformas activas + bundles obligatorios.
4. `GitFlow:` rama actual + cumplimiento efectivo.
5. `SDD:` modo + sesión + validez.
6. `Evidence:` stage/outcome/findings/ai_gate.
7. `Pre-write:` nivel de enforcement previo a escritura.
8. `Next:` siguiente acción exacta.

### Gap actual frente al bloque final

- `status` / `doctor` ya tienen buena parte del bloque, pero todavía mezclan contrato superficial con governance efectiva.
- El menú `Consumer` todavía está más orientado a ejecutar opciones que a presentar primero el estado contractual del repo.
- Los hooks expresan outcome y remediation, pero no exponen de forma homogénea el contrato efectivo completo.
- MCP tiene piezas útiles (`pre_flight_check`, `auto_execute_ai_start`), pero aún no comparte un bloque único y explícito de contrato/gobernanza con el resto.

### Regla de implementación para S1

- Primero se define y estabiliza este bloque en una capa compartida.
- Después cada superficie lo renderiza.
- No se permite que cada superficie invente su propia semántica de governance.

---

## Matriz de mapeo S1 por superficie

Esta matriz aterriza el bloque canónico sobre las superficies reales del producto para que el paso a implementación no dependa de interpretación.

| Superficie | Ya resuelve | Hueco principal frente a S1 | Evidencia base |
|------------|-------------|-----------------------------|----------------|
| `status` | `governance_effective`, SDD, evidencia, branch, `contract_surface`, hints de bootstrap. | Falta `repo_contract_effective` resuelto y `platform_bundles_effective` visible como contrato, no como presencia de archivos. | `integrations/lifecycle/governanceObservationSnapshot.ts`, `integrations/lifecycle/cliStatusOutputs.ts`. |
| `doctor` | Igual que `status` más veredicto final de doctor. | Sigue heredando el mismo gap de contrato efectivo y bundles/plataformas; falta semántica unificada con menú/hook output. | `integrations/lifecycle/governanceObservationSnapshot.ts`, `integrations/lifecycle/cliDoctorOutputs.ts`. |
| Hooks | `NEXT:` y `REMEDIATION:` claros para bloqueos; stage outcome visible. | Falta mostrar contrato efectivo completo, bundles/plataformas y GitFlow más allá del finding puntual. | `integrations/git/runPlatformGateOutput.ts`, `integrations/git/stageRunners.ts`. |
| Menú `Consumer` | Preflight útil: branch, upstream, worktree, evidence y gate de la ejecución. | Todavía no arranca mostrando primero el estado contractual del repo; está más orientado a ejecutar opciones que a gobernar el flujo. | `scripts/framework-menu-consumer-actions-lib.ts`, `scripts/framework-menu-consumer-preflight-render.ts`, `docs/product/USAGE.md`. |
| MCP `pre_flight_check` | Devuelve gate, policy, violations, repo_state, skills_contract, hints, learning context. | Falta devolver el mismo bloque canónico explícito de contrato/gobernanza que `status`/`doctor`. | `integrations/mcp/preFlightCheck.ts`. |
| MCP `auto_execute_ai_start` | Ya da `next_action`, reason code, confidence y gate resume para PRE_WRITE. | Falta vincular esa decisión con contrato efectivo del repo y governance completa, no solo con la primera violación. | `integrations/mcp/autoExecuteAiStart.ts`. |

### Lectura operativa de la matriz

- `status` y `doctor` son hoy la base más madura del bloque canónico.
- hooks son la base más madura de `next_action` y remediación accionable.
- MCP ya tiene buena lógica operativa, pero le falta hablar el mismo idioma visible de governance.
- el menú `Consumer` es la superficie con más valor potencial de producto y a la vez el hueco UX más claro: todavía ejecuta bien, pero todavía **no gobierna primero**.

### Implicación directa para implementación

La S1 debería ejecutarse en este orden técnico:

1. extraer capa compartida para el bloque canónico;
2. conectar `status` / `doctor` a esa capa sin perder su salida actual;
3. enseñar ese bloque al inicio del menú `Consumer`;
4. hacer que hooks y MCP reutilicen el mismo vocabulario;
5. solo después refinar presentación/UI.

---

## Tabla final S1 — campo canónico -> origen actual -> destino

Esta tabla convierte la Slice S1 en una guía de implementación casi mecánica: para cada campo del bloque canónico queda fijado qué función o fichero es hoy la mejor base, qué superficie ya lo enseña y cuál debe ser su destino final cuando S1 se ejecute desde `develop`.

| Campo del bloque canónico | Función / fichero base actual | Qué aporta hoy | Superficie que ya lo usa | Destino S1 |
|---------------------------|-------------------------------|----------------|--------------------------|------------|
| `repo_contract_effective` | `integrations/lifecycle/governanceObservationSnapshot.ts` (`contract_surface`) + `integrations/mcp/preFlightCheck.ts` (`skills_contract`) | Superficie contractual parcial: presencia de `AGENTS.md`, `skills.*`, `.pumuki/adapter.json` y contrato de skills por stage. | `status` / `doctor` (parcial), MCP `pre_flight_check` (parcial). | Extraer resolvedor único de contrato del repo y renderizarlo primero en `status`, `doctor`, menú `Consumer`, hooks y MCP. |
| `governance_effective` | `integrations/lifecycle/governanceObservationSnapshot.ts` | Estado `green` / `attention` / `blocked` + `attention_codes`. | `status`, `doctor`. | Mantener este origen como verdad canónica y reutilizarlo sin forks semánticos en menú, hooks y MCP. |
| `platform_bundles_effective` | `integrations/mcp/preFlightCheck.ts` (`skills_contract`) + reglas de evidence/gate por plataforma | Cobertura de contrato de skills/bundles por stage, pero aún sin resumen humano estable por plataforma. | MCP `pre_flight_check` (indirecto). | Convertirlo en bloque visible de plataformas/bundles activos para `status`, `doctor`, menú y hooks; MCP debe devolver la misma estructura. |
| `gitflow_effective` | `integrations/lifecycle/governanceObservationSnapshot.ts` (`git.current_branch`, `on_protected_branch_hint`) + `integrations/git/runPlatformGateOutput.ts` + violations `GITFLOW_PROTECTED_BRANCH` en gate | Hint de rama protegida, branch actual y remediación accionable cuando el gate bloquea. | `status` / `doctor` (hint), hooks (acción/remediación), menú `Consumer` (branch en preflight). | Resumen único de cumplimiento GitFlow/naming con mismo vocabulario en todas las superficies, no solo hint o finding aislado. |
| `sdd_effective` | `integrations/lifecycle/governanceObservationSnapshot.ts` (`sdd`, `sdd_session`) | Modo efectivo (`off/advisory/strict`), fuente del flag y validez de sesión. | `status`, `doctor`. | Reutilizar exactamente esta verdad en menú, hooks y MCP para evitar verdes engañosos cuando SDD está apagado o la sesión expira. |
| `evidence_effective` | `integrations/lifecycle/governanceObservationSnapshot.ts` (`summarizeEvidence`) + `integrations/mcp/preFlightCheck.ts` + render de menú en `scripts/framework-menu-consumer-preflight-render.ts` | Outcome, ai_gate, source, edad, findings y hints operativos, pero aún dispersos según superficie. | `status`, `doctor`, menú `Consumer`, MCP `pre_flight_check`. | Consolidar una vista única de evidencia/gate con promotion pendiente (`PUMUKI-INC-074`) y reutilizarla en todas las superficies. |
| `prewrite_effective` | `integrations/lifecycle/governanceObservationSnapshot.ts` (`policy_strict.pre_write`) + `integrations/mcp/preFlightCheck.ts` + `integrations/mcp/autoExecuteAiStart.ts` | Señal de strict/advisory en PRE_WRITE y decisión operativa previa a escritura. | `status` / `doctor` (strict parcial), MCP `pre_flight_check` / `auto_execute_ai_start`. | Exponer en todas las superficies si PRE_WRITE es realmente bloqueante, solo advisory o aún no universal; esto conecta directamente con `PUMUKI-INC-072`. |
| `next_action` | `integrations/mcp/autoExecuteAiStart.ts` (`next_action`) + `integrations/git/runPlatformGateOutput.ts` (`NEXT:` / `REMEDIATION:`) | Remediación accionable con comandos concretos, especialmente sólida en hooks y MCP. | hooks, MCP `auto_execute_ai_start`. | Llevar la misma calidad de siguiente acción a `status`, `doctor` y menú `Consumer`, sin duplicar catálogos ni inventar mensajes por superficie. |

### Regla de ejecución derivada de la tabla

- No se implementa S1 “por pantallas”, sino por **campos canónicos**.
- Cada campo debe tener una fuente única o explícitamente reconciliada antes de tocar UI.
- Si al implementar aparece una segunda fuente competidora para el mismo campo, eso cuenta como desviación de rescate y se corrige antes de seguir.

---

## Definition of Done S1 — rescate real, no refactor cosmético

La Slice S1 solo puede marcarse como cerrada si recupera comportamiento de producto observable y no solo reordena código.

### Criterios de aceptación funcional

- `status` y `doctor` muestran el mismo bloque canónico en el mismo orden lógico y dejan de sugerir verde engañoso cuando la governance efectiva no es verde.
- El menú `Consumer` abre mostrando primero el bloque canónico del repo y después las acciones operativas.
- hooks siguen emitiendo `NEXT:` y `REMEDIATION:` pero además usan el mismo vocabulario de contrato/gobernanza que CLI y menú.
- MCP `pre_flight_check` y `auto_execute_ai_start` devuelven el mismo idioma de governance que CLI/hooks, no una semántica paralela.
- `repo_contract_effective` deja de ser presencia de archivos y pasa a ser un contrato resuelto visible.
- `platform_bundles_effective` deja visible qué bundles/plataformas gobiernan realmente el repo actual.
- `prewrite_effective` deja claro si PRE_WRITE es bloqueo real, advisory o hueco todavía pendiente hacia `PUMUKI-INC-072`.

### Paquete mínimo de no-regresión

Antes de considerar S1 como hecha en una rama válida desde `develop`, debe existir evidencia verde al menos en estas áreas:

| Área | Evidencia mínima esperada |
|------|---------------------------|
| Governance snapshot | `integrations/lifecycle/__tests__/governanceObservationSnapshot.test.ts` cubriendo bloque canónico base, attention/blocked y hints críticos. |
| CLI status/doctor | tests de lifecycle/doctor/status asegurando que el bloque canónico se imprime y no rompe la salida humana actual. |
| Hooks | `integrations/git/__tests__/runPlatformGateOutput.test.ts` manteniendo `NEXT:` / `REMEDIATION:` y nuevo vocabulario compartido. |
| MCP preflight | `integrations/mcp/__tests__/preFlightCheck.test.ts` cubriendo contrato/gobernanza compartidos. |
| MCP auto-execute | `integrations/mcp/__tests__/autoExecuteAiStart.test.ts` manteniendo `next_action` accionable y alineado con contrato efectivo. |
| Menú Consumer | `scripts/__tests__/framework-menu-consumer-runtime-menu.test.ts`, `framework-menu-consumer-preflight-*.test.ts` y `framework-menu-consumer-runtime-actions.test.ts` garantizando que el bloque canónico aparece sin romper shell mínima ni acciones actuales. |

### Guardrails de producto para no recaer

- No vale cerrar S1 si el resultado solo mejora `status` y deja menú/MCP desalineados.
- No vale cerrar S1 si la nueva UX del menú degrada la shell mínima o rompe el flujo `Consumer`.
- No vale cerrar S1 si la implementación reintroduce “verde técnico” cuando SDD/evidence/GitFlow siguen en `attention`.
- No vale cerrar S1 si la solución debilita skills modernas por plataforma, en especial iOS/Swift y su baseline actual.

---

## Receta de arranque S1 desde `develop`

Esta receta existe para evitar otro arranque difuso o fuera de flujo cuando el rescate pase de documentación a ejecución real.

### Preconditions

- Rama base disponible: `develop`.
- Rama de trabajo válida: `refactor/<descripcion-kebab-case>` o `feature/<descripcion-kebab-case>`.
- `PUMUKI-RESET-MASTER-PLAN.md` actualizado hasta la última definición de S1.
- El backlog externo de RuralGo sigue siendo la referencia de prioridad para `PUMUKI-INC-071/072/074`.

### Secuencia mínima

1. Cambiar a `develop` y actualizarla.
2. Crear una rama de trabajo explícita para S1.
3. Implementar primero la capa compartida del bloque canónico.
4. Conectar `status` / `doctor`.
5. Conectar menú `Consumer`.
6. Alinear hooks y MCP al mismo vocabulario.
7. Ejecutar el paquete mínimo de no-regresión definido arriba.
8. Solo después actualizar tracking externo/interno con evidencia real.

### Comandos guía

```bash
git checkout develop
git pull --ff-only origin develop
git checkout -b refactor/s1-governance-console
```

Si el alcance final de S1 se acota a bugfix visible en consumidor y no a refactor estructural, también se acepta:

```bash
git checkout develop
git pull --ff-only origin develop
git checkout -b feature/s1-governance-console
```

### Criterio de STOP durante el arranque

- Si `develop` no está sincronizada o el worktree trae ruido no relacionado que contamine S1, parar antes de editar.
- Si la nueva rama intenta mezclar S1 con otra línea (`Fase 4`, mejoras internas ajenas, features no ligadas a RuralGo), parar y recortar alcance.
- Si la implementación intenta saltarse la capa compartida e ir directa a una sola superficie, parar y volver a la tabla `campo canónico -> origen actual -> destino`.

---

## Matriz S1 -> backlog externo RuralGo

Esta matriz evita que la Slice S1 se cierre “internamente” sin traducirse a movimiento real sobre `PUMUKI-INC-070..077`.

| INC externo | Qué parte de S1 impacta directamente | Evidencia mínima para poder mover estado en RuralGo |
|-------------|--------------------------------------|-----------------------------------------------------|
| `PUMUKI-INC-070` | Bloque canónico visible en `status` / `doctor` con SDD, sesión, evidencia y governance efectiva. | `status`/`doctor` mostrando SDD apagado o sesión inválida sin falso verde; tests de lifecycle actualizados; validación en consumer real. |
| `PUMUKI-INC-071` | `repo_contract_effective` resuelto y visible en CLI/hooks/MCP/menú. | Contrato efectivo del repo materializado desde `AGENTS.md` + skills + GitFlow + tracking, con salida visible y tests de contrato. |
| `PUMUKI-INC-072` | `prewrite_effective` explicado y unificado; inicio del camino hacia pre-edit gate real. | Señal inequívoca del nivel PRE_WRITE en todas las superficies y remediación accionable antes de editar; si sigue sin universalidad, dejarlo explícito y no marcar FIXED. |
| `PUMUKI-INC-073` | Separación estricta entre “instalado” y “governance efectiva” en `status` / `doctor` / menú. | Salida humana sin verde engañoso cuando governance no es `green`; tests y validación en RuralGo. |
| `PUMUKI-INC-074` | `evidence_effective` unificado como bloque visible y conectado a policy. | Al menos contrato visible de severidad/outcome y plan de promotion por repo; solo mover a FIXED cuando evidence gobierne de verdad el bloqueo configurable. |
| `PUMUKI-INC-075` | Parte de bootstrap visible a través de `repo_contract_effective` + hints + manifiesto de consumo futuro. | Salida canónica que haga innecesaria la lectura manual para entender skills/contrato activos; si no hay bootstrap automático completo, mantener `REPORTED` o mover parcialmente. |
| `PUMUKI-INC-076` | `gitflow_effective` como cumplimiento semántico, no hint aislado. | Rama/naming/flujo visibles como parte del contrato efectivo y del gate, con bloqueo/remediación consistentes. |
| `PUMUKI-INC-077` | Contrato documental visible dentro del contrato efectivo del repo. | Fuente canónica de tracking y obligación de actualización reflejadas en el contrato del repo; solo FIXED cuando exista enforcement declarativo real. |

### Lectura honesta de la matriz

- S1 está diseñada para impactar **directamente** `070`, `071`, `073` y `076`.
- S1 prepara la base estructural para `072`, `074`, `075` y `077`, pero no garantiza por sí sola su cierre completo.
- Esto significa que S1 puede dejar varios `INC` en mejor estado o con cierre parcial, pero no autoriza a marcar `FIXED` sin validación en consumer y evidencia explícita en el MD externo.

---

## Checklist de validación S1 en consumer RuralGo

Cuando S1 se implemente y publique desde una rama válida nacida de `develop`, la validación real debe hacerse en RuralGo antes de tocar estados `FIXED` en el MD externo.

### Comandos mínimos en RuralGo

```bash
npm run pumuki:status
npm run pumuki:doctor
npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json
npx --yes --package pumuki@latest pumuki-pre-commit
npx --yes --package pumuki@latest pumuki-pre-push
```

### Validaciones MCP mínimas

- `mcp__pumuki_enterprise__check_sdd_status`
- `mcp__pumuki_evidence__evidence_findings`
- `mcp__pumuki_evidence__evidence_summary`

### Qué debe observarse para considerar S1 eficaz

- `status` y `doctor` enseñan el bloque canónico de gobernanza y no llaman verde a un repo con governance en `attention`.
- Si SDD está `off` o la sesión está expirada, esa condición aparece como verdad visible, no como detalle escondido.
- El contrato efectivo del repo ya no depende de “leer a mano” `AGENTS.md` para saber qué manda.
- La rama actual y GitFlow aparecen como parte del contrato/gate visible.
- PRE_WRITE queda descrito de forma inequívoca como bloqueo real, advisory o gap pendiente.
- Los findings de evidencia y el estado `ai_gate` se entienden de un vistazo, con siguiente acción concreta.

### Regla para mover estados en el MD externo

- No mover un `INC` a `FIXED` solo porque la slice esté mergeada en Pumuki.
- Mover a `FIXED` únicamente si:
  - la versión publicada de `pumuki` está instalada en RuralGo,
  - los comandos anteriores confirman el comportamiento esperado,
  - y la fila correspondiente del MD externo se actualiza con evidencia real (`version`, `comando`, `resultado`, `ref PR/commit/release`).

---

## Estrategia de publicación y rollout S1

S1 no se considera cerrada a nivel de producto hasta completar el ciclo **merge -> release -> repin consumer -> validación -> tracking externo**.

### Pre-publicación en Pumuki

Antes de publicar una semver nueva para S1, la rama de release debe salir de `develop` y cumplir la barra mínima del repo:

```bash
npm run -s typecheck
npm run -s test:deterministic
npm run -s validation:package-manifest
npm run -s validation:package-smoke
npm run -s validation:package-smoke:minimal
npm run -s validation:local-merge-bar
```

### Regla de publicación

- Publicar solo desde `release/<semver>` cortada desde `develop`.
- No publicar si queda una regresión conocida en el bloque canónico, en shell mínima del menú, o en el paquete mínimo de no-regresión de S1.
- La nueva release debe reflejarse en `CHANGELOG.md` / `docs/operations/RELEASE_NOTES.md` con referencia explícita a S1 y al backlog RuralGo afectado.

### Orden de rollout en consumers

1. **RuralGo** primero, porque es el consumer que originó `PUMUKI-INC-070..077`.
2. **SAAS** después, si la release toca contrato/gate/menu de forma transversal.
3. **Flux** después, si la release toca las mismas superficies compartidas.

### Validación post-rollout

- Repin de `pumuki` a la nueva semver en el consumer.
- Reejecución del checklist de validación de RuralGo definido en la sección anterior.
- Confirmación de que `status`, `doctor`, PRE_WRITE y MCP cuentan la misma historia.
- Solo después actualizar:
  - `PUMUKI-RESET-MASTER-PLAN.md`
  - `docs/operations/RELEASE_NOTES.md`
  - y la fila correspondiente en el MD externo del consumer.

### Rollback mínimo

Si la release de S1 introduce regresión real en consumers:

1. volver a la semver estable anterior;
2. repinear los consumers afectados a esa versión;
3. reejecutar `status`, `doctor`, hooks y el baseline del consumer impactado;
4. documentar rollback y causa antes de reabrir trabajo.

---

## Evidencia esperada por `INC` tras rollout de S1

Esta tabla evita dos errores:

- marcar `FIXED` en RuralGo solo porque S1 esté publicada;
- declarar que S1 cubre más de lo que realmente rescata.

| INC | Qué debe verse tras rollout S1 | Evidencia mínima a registrar en RuralGo | Estado esperado tras S1 |
|-----|--------------------------------|-----------------------------------------|-------------------------|
| `PUMUKI-INC-070` | `status` y `doctor` muestran el bloque canónico y hacen visible `SDD off/expired`, evidencia `WARN` y `governance_effective` no verde | salida humana de `npm run pumuki:status` + `npm run pumuki:doctor`, versión publicada instalada, fragmento visible del bloque de gobernanza | **Candidate FIXED** si la visibilidad engañosa desaparece en CLI real |
| `PUMUKI-INC-071` | `repo_contract_effective` aparece como bloque consumible y coherente en `status` / `doctor` / menú `Consumer` / MCP | salida humana y/o `--json` donde se vea contrato efectivo del repo, skills/platform bundles, GitFlow, tracking y siguiente acción | **Candidate FIXED** si el contrato queda realmente resuelto y visible de forma homogénea |
| `PUMUKI-INC-072` | PRE_WRITE pasa a describirse de forma inequívoca en contrato/gobernanza y MCP/hook devuelven remediación exacta | evidencia de PRE_WRITE y MCP con `BLOCKED`/`next_action`, más captura del bloque `prewrite_effective` | **Seguirá REPORTED** salvo que S1 introduzca de verdad `pre-edit gate` automático antes de escribir |
| `PUMUKI-INC-073` | `status` y `doctor` dejan de emitir verde engañoso y separan instalación, advisory y enforcement efectivo | salida humana de `status` y `doctor` con veredicto no verde cuando `governance_effective != green` | **Candidate FIXED** si el verde engañoso desaparece en RuralGo |
| `PUMUKI-INC-074` | findings de evidencia aparecen ligados al contrato visible y a la siguiente acción, no como ruido lateral | `mcp__pumuki_evidence__evidence_findings` + `...summary` + `status/doctor` mostrando conexión clara con governance | **Seguirá REPORTED** salvo que S1 ya incluya promotion declarativa `WARN -> BLOCK` por repo |
| `PUMUKI-INC-075` | bootstrap visible y menos dependiente de lectura manual: contrato efectivo, superficies activas, adapter/mensaje de arranque claros | evidencia de instalación/arranque con `.pumuki/adapter.json`, bloque de contrato efectivo y hints accionables | **Seguirá REPORTED** salvo que S1 entregue manifiesto/bootstrap efectivo para agente y repo |
| `PUMUKI-INC-076` | GitFlow/naming aparecen como parte del contrato/gate efectivo y no solo como texto en `AGENTS.md` | rama de prueba + `status/doctor`/hook mostrando `gitflow_effective` y bloqueo o `attention` coherente | **Candidate FIXED** si el contrato de rama queda realmente integrado en el gate visible |
| `PUMUKI-INC-077` | tracking canónico aparece en el contrato efectivo y como hint/remediación, no como conocimiento implícito del owner | bloque `repo_contract_effective` con tracking/owner, más salida que apunte a la fuente canónica | **Seguirá REPORTED** salvo que S1 añada enforcement documental bloqueante sobre el tracking |

### Regla de honestidad para actualizar RuralGo

- Si una fila queda en `Candidate FIXED`, no mover a `FIXED` hasta que la evidencia exista en RuralGo con semver publicada y comandos ejecutados.
- Si una fila queda en `Seguirá REPORTED`, documentar expresamente que S1 solo preparó base estructural y cuál es la siguiente slice necesaria.

---

## Paquete de evidencia por comando para RuralGo post-rollout

Esta sección prepara un formato casi literal para actualizar `pumuki-integration-feedback.md` cuando S1 se publique y se repinee en RuralGo.

| Comando | Qué debe capturarse | Fragmentos esperados tras S1 | INCs a los que más aporta |
|---------|---------------------|------------------------------|---------------------------|
| `npm run pumuki:status` | salida humana completa + versión instalada | bloque canónico visible, `governance_effective != green` cuando proceda, `repo_contract_effective`, `gitflow_effective`, `sdd_effective`, `evidence_effective`, `next_action` | `070`, `071`, `073`, `076`, `077` |
| `npm run pumuki:doctor` | salida humana completa + exit code + veredicto final | mismo vocabulario que `status`, sin verde engañoso, y veredicto coherente con governance real | `070`, `073`, `076` |
| `npx --yes --package pumuki@<semver> pumuki sdd validate --stage=PRE_WRITE --json` | JSON completo + `decision` + `next_action` | `prewrite_effective` coherente, remediación exacta, semántica clara de `ALLOWED/WARN/BLOCKED` | `072`, `074` |
| `npx --yes --package pumuki@<semver> pumuki-pre-commit` | salida terminal del hook + `NEXT:` / `REMEDIATION:` | misma historia que `status/doctor`, sin contradicción con governance y GitFlow | `071`, `073`, `076`, `077` |
| `npx --yes --package pumuki@<semver> pumuki-pre-push` | salida terminal del hook + `NEXT:` / `REMEDIATION:` | GitFlow/naming y contrato de repo visibles como parte del gate efectivo | `071`, `076`, `077` |
| `mcp__pumuki_enterprise__check_sdd_status` | payload MCP serializado | estado SDD alineado con lo que ven `status` y `doctor` | `070`, `072`, `073` |
| `mcp__pumuki_evidence__evidence_findings` | findings activos + severidad + resumen | findings conectados a governance y siguientes acciones comprensibles | `070`, `074` |
| `mcp__pumuki_evidence__evidence_summary` | summary + counters + outcome | outcome visible y consistente con `status/doctor` | `070`, `073`, `074` |

### Plantilla de actualización rápida en RuralGo

Al mover o reevaluar una fila en el MD externo, intentar registrar al menos:

- `version`: semver de `pumuki` publicada y repineada en RuralGo
- `comando`: comando exacto ejecutado
- `resultado actual`: resumen literal del fragmento observado
- `comportamiento esperado`: frase corta indicando si S1 ya lo cubre o si queda para siguiente slice
- `estado`: `FIXED` solo si hay evidencia real en consumer; en caso contrario `REPORTED`

### Regla de convergencia mínima

- No aceptar una validación basada en un solo comando.
- Para considerar que S1 cuenta una historia coherente en RuralGo, deben alinearse como mínimo:
  - `status`
  - `doctor`
  - `PRE_WRITE`
  - y una lectura MCP (`check_sdd_status` o evidencia)

---

## Criterio de paso a implementación S1

Podemos considerar cerrada la preparación documental de S1 y pasar a implementación real desde `develop` solo si se cumplen a la vez estas condiciones:

- La visión del owner y la esencia a rescatar ya están fijadas en este plan.
- La matriz `mantener / rescatar / descartar / unificar` ya está cerrada para S1.
- El bloque canónico de gobernanza ya está definido.
- La tabla `campo canónico -> origen actual -> destino` ya existe.
- La `Definition of Done` y el paquete de no-regresión de S1 ya existen.
- La receta de arranque desde `develop` ya existe.
- La matriz `S1 -> backlog externo RuralGo` ya existe.
- El checklist de validación en consumer RuralGo ya existe.
- La estrategia de publicación/rollout ya existe.
- La tabla de evidencia esperada por `INC` y el paquete de evidencia por comando ya existen.

### Regla de STOP antes de abrir la rama de implementación

- Si cualquiera de los puntos anteriores no está documentado aquí, no abrir rama de implementación todavía.
- Si RuralGo cambia el backlog externo de forma material, revisar primero esta preparación antes de tocar `develop`.
- Si se intenta usar `release/6.3.65` para implementación funcional de S1, el estado correcto sigue siendo `BLOCKED` por GitFlow.

### Movimiento correcto cuando llegue el momento

Una vez cumplido el criterio anterior, el salto correcto sigue siendo:

```bash
git checkout develop
git pull --ff-only origin develop
git checkout -b refactor/s1-governance-console
```

---

## Congelación y prioridad externa (AGENTS)

| ID | Estado | Nota |
|----|--------|------|
| **PUMUKI-BDD-001** | ✅ | TDD/BDD estricto + observabilidad en terminal. **Cierre 2026-04-05:** `remediationCatalog` + `BLOCK_NEXT_ACTION_BY_CODE` en `printGateFindings` para todos los códigos TDD/BDD emitidos por `integrations/tdd/enforcement.ts` (missing/invalid/empty/duplicate/scenario/timeline/red-green/waiver); tests `runPlatformGateOutput.test.ts`; doc `CONFIGURATION.md` (*TDD/BDD Vertical Enforcement Contract*); índice MCP en `docs/validation/README.md` + `docs/README.md` + `README.md`. **Consumidor:** `pumuki-integration-feedback.md` — fila **PUMUKI-BDD-001** ✅ FIXED. |
| **Regla MDs externos** | — | Si hay items abiertos en SAAS / R_GO / Flux, la única 🚧 permitida aquí debe mapear a ese bug; no abrir `PUMUKI-2xx` internos que no desbloqueen el externo. |

---

## Fase interna paralela (complejidad CLI)

| Fase | Estado | Objetivo |
|------|--------|----------|
| **Fase 4** | ✅ | Reducir complejidad de `integrations/lifecycle/cli.ts` (imports, líneas, SDD en `cliSdd.ts`, `import()` perezoso, sin ciclos en runtime principal). **Progreso 2026-04-05:** *slice 1* — `cliParseArgs.ts`. *slice 2* — `aiGateTypes.ts` + `evaluateAiGateConstants.ts` (gate por debajo del guardrail de 1500 líneas). *slice 3* — `cliPreWriteExperimental.ts` (PRE_WRITE/SDD/analytics/saas envelopes off por defecto + comandos advisory); `cli.ts` ~1487 líneas. **Progreso 2026-04-15:** *slice 4* — `cliPreWriteValidation.ts` extrae `resolvePreWriteNextAction`, `resolvePreWriteBlockedRemediation`, `buildPreWriteValidationPanel`, `buildPreWriteValidationEnvelope` y localizadores SDD/AI gate; `cliSdd.ts` deja de importarlos desde `cli.ts` y la regresión queda en `cliPreWriteValidation.test.ts`. *slice 5* — `cliStatusOutputs.ts` extrae la salida humana de `status` (repo/versiones/hooks/governance/core loop/policy/experimentales), `cli.ts` baja a ~2390 líneas y la regresión queda en `cliStatusOutputs.test.ts`. *slice 6* — `cliDoctorOutputs.ts` extrae `printDoctorReport` y `printRemoteCiDiagnostics`; `cli.ts` baja a ~2267 líneas y la regresión queda en `cliDoctorOutputs.test.ts`. *slice 7* — `cliWatchOutputs.ts` extrae `printWatchTick` y `printWatchDoneHuman`; `cli.ts` baja a ~2264 líneas y la regresión queda en `cliWatchOutputs.test.ts`. *slice 8* — `cliBootstrapOutputs.ts` extrae `printBootstrapHuman`; `cli.ts` baja a ~2242 líneas y la regresión queda en `cliBootstrapOutputs.test.ts`, manteniendo además verde el caso real `runLifecycleCli bootstrap --enterprise`. *slice 9* — `cliLoopOutputs.ts` extrae `printLoopRunHuman`, `printLoopListHuman`, `printLoopSessionStatusHuman`, `printLoopExportHuman` y `printLoopResumeStopHuman`; `cli.ts` se mantiene en ~2242 líneas y los casos reales de `loop` siguen verdes en `cli.test.ts`. **Progreso 2026-04-16:** *slice 10* — `cliAnalyticsHotspots.ts` extrae `formatHotspotsMarkdownReport`, `buildHotspotsPublishDiagnostics`, `printHotspotsPublishDiagnostics`, `printAnalyticsExperimentalDisabledHuman` y `printHotspotsReportHuman`; `cli.ts` baja a ~2026 líneas y los casos reales de `analytics` siguen verdes en `cli.test.ts`. *slice 11* — `cliLifecycleCommandOutputs.ts` extrae `printLifecycleInstallHuman`, `printInstallMcpFollowupHuman`, `printLifecycleUninstallHuman`, `printLifecycleRemoveHuman`, `printLifecycleUpdateHuman`, `printPolicyReconcileHuman` y `printAdapterInstallHuman`; `cli.ts` baja a ~1973 líneas, queda más cerca de orquestación pura y la regresión dedicada vive en `cliLifecycleCommandOutputs.test.ts`. *slice 12* — `cli.ts` introduce `import()` perezoso en las rutas pesadas de `bootstrap / install / uninstall / remove / update / doctor / status / watch / loop / analytics / policy / adapter`, reutiliza los helpers ya extraídos, mantiene verde la regresión dedicada y los casos reales del CLI, y deja el runtime principal en ~2013 líneas con grafo de carga más contenido. **Cierre de fase:** la auditoría final concluye que ya no queda otro bounded slice pequeño con retorno comparable; lo que sobrevive en `cli.ts` pertenece al parser, contratos de flags, envelopes experimentales, dependencias base y wiring del runtime. **No** sustituye RG-P0-1; si hay conflicto de prioridad con bugs externos, manda AGENTS. |

---

## Tarea activa única

| Documento | Tarea 🚧 actual |
|-----------|-----------------|
| Este plan | [🚧] - `PUMUKI-INC-129` / RuralGo: permitir commit de remediación iOS que elimina `makeSUT()` + `trackForMemoryLeaks()` sin bloquear por `governance.skills.global-enforcement.incomplete`, y respetar aliases de notificaciones desactivadas (`PUMUKI_SYSTEM_NOTIFICATIONS=0`, `PUMUKI_NOTIFICATIONS=0`). Estado 2026-05-06: bug externo activo; congelada la continuación interna de `PARITY-IOS-001` hasta publicar fix, repinear primero RuralGo y validar commit normal sin `--no-verify`. |

Snapshot de rollout `6.3.81` (2026-04-20):
- `SAAS` (`chore/pumuki-6-3-81-rollout`): repin a `pumuki@6.3.81` completado; `status` y `doctor` alineados en `6.3.81`; `pumuki-pre-commit` termina en `ALLOW`.
- `Flux_training` (`chore/pumuki-6-3-81-rollout`): repin a `pumuki@6.3.81` completado; `status` y `doctor` ya reflejan `lifecycleState.version=6.3.81`, pero `pumuki-pre-commit` sigue bloqueado por `TRACKING_CANONICAL_SOURCE_CONFLICT`; no es regresión nueva de `pumuki`, sino deuda viva del consumer.
- `R_GO` (`chore/pumuki-6-3-81-rollout`): repin a `pumuki@6.3.81` completado en worktree limpio; `status` y `doctor` alineados en `6.3.81`; `pumuki-pre-commit` sigue bloqueado por `TRACKING_CANONICAL_SOURCE_CONFLICT` propio del consumer.

Snapshot de rollout `6.3.83` (2026-04-20):
- `SAAS` (`chore/pumuki-6-3-83-rollout`): repin a `pumuki@6.3.83` completado; `pumuki install`, `status` y `doctor` alineados en `6.3.83`; `pumuki-pre-commit` termina en `ALLOW`.
- `Flux_training` (`chore/pumuki-6-3-83-rollout`): repin a `pumuki@6.3.83` completado; `status` y `doctor` ya reflejan `lifecycleState.version=6.3.83`, pero `pumuki-pre-commit` sigue bloqueado por `TRACKING_CANONICAL_SOURCE_CONFLICT`; no es regresión nueva de `pumuki`, sino deuda viva del consumer.
- `R_GO` (`chore/pumuki-6-3-83-rollout`): repin a `pumuki@6.3.83` completado en worktree limpio; `status` y `doctor` alineados en `6.3.83`; `pumuki-pre-commit` sigue bloqueado por `TRACKING_CANONICAL_SOURCE_CONFLICT` propio del consumer.

Snapshot de rollout `6.3.142` (2026-05-05):
- `R_GO` (`chore/pumuki-6-3-142-rollout`, PR #1908): repin a `pumuki@6.3.142` completado y mergeado en `develop`; `status` y `doctor` reportan `packageVersion=6.3.142` sin issues; canary staged en worktree aislado confirma bloqueo PRE_WRITE por `ios.solid.ocp.discriminator-switch-branching` y `skills.ios.no-solid-violations`; commit y push pasaron hooks managed sin `--no-verify`.

Snapshot de rollout `6.3.143` (2026-05-05):
- `R_GO` (`chore/pumuki-6-3-143-rollout`, PR #1910): repin a `pumuki@6.3.143` completado y mergeado en `develop`; `status` y `doctor` reportan `packageVersion=6.3.143` sin issues; canary staged en worktree aislado confirma bloqueo `PRE_WRITE` por evidencia TDD/BDD caducada (`TDD_BDD_EVIDENCE_STALE`); feedback externo actualizado en PR #1911 para cerrar `PUMUKI-INC-060` y dejar `PUMUKI-INC-061` como siguiente bug vivo.

Snapshot de rollout `6.3.144` (2026-05-05):
- `R_GO` (`chore/pumuki-6-3-144-rollout`, PR #1912): repin a `pumuki@6.3.144` completado y mergeado en `develop`; `status` y `doctor` reportan `runtime=consumerInstalled=lifecycleInstalled=6.3.144`, `driftWarning=null`, `issues=[]`; canary concurrente de `pumuki sdd evidence` conserva dos slices paralelos y deja JSON válido sin `.lock`/`.tmp` residual; feedback externo actualizado para cerrar `PUMUKI-INC-122` y dejar `PUMUKI-INC-123`/`PUMUKI-INC-124` como High activos.

Snapshot de rollout `6.3.145` (2026-05-05):
- `R_GO` (`chore/pumuki-6-3-145-rollout`, PR #1913): repin a `pumuki@6.3.145` completado y mergeado en `develop`; `status` y `doctor` reportan `runtime=consumerInstalled=lifecycleInstalled=6.3.145`, `driftWarning=null`, `issues=[]`; canary `PRE_COMMIT` limitado a `apps/ios/Tests/iOS/BuyerUISmoke/BuyerCommerceUISmokeTests.swift` devuelve `gate_exit_code=0`, `files_scanned=1` y no emite findings `ios-test-quality` ni `xctassert`; feedback externo actualizado para cerrar `PUMUKI-INC-124` y dejar `PUMUKI-INC-123` como único High activo.

Snapshot de rollout `6.3.85` (2026-04-20):
- `SAAS` (`chore/pumuki-6-3-83-rollout`): verde sobre `6.3.85`; PR mergeada contra `main`: `app-supermercados#10` (`https://github.com/SwiftEnProfundidad/app-supermercados/pull/10`), squash `e643f9f83d6f860cbd72f7bee67855b74dea213e`.
- `Flux_training` (`chore/pumuki-6-3-83-rollout`): repin a `pumuki@6.3.85` completado; `status`, `doctor`, `PRE_WRITE` y `pumuki-pre-commit` ya convergen en `ALLOW`; PR mergeada contra `develop`: `flux-training#7` (`https://github.com/SwiftEnProfundidad/flux-training/pull/7`), squash `4951c38af597d555006d1b6dd1af15d9e9c3819b`.
- `R_GO` (`chore/pumuki-6-3-83-rollout`): repin a `pumuki@6.3.85` completado; `status`, `doctor`, `PRE_WRITE` y `pumuki-pre-commit` ya convergen en `ALLOW`; PR mergeada contra `develop`: `R_GO#1871` (`https://github.com/SwiftEnProfundidad/R_GO/pull/1871`), squash `8cf55e282b02f07a3feac4110fa3a09b658732e0`.
- Estado de backlog externo tras consolidación: `SAAS`, `Flux_training` y `R_GO` quedan sin incidencias activas de Pumuki en sus MDs consumidores; el siguiente trigger válido es una reproducción nueva con evidencia ejecutable.

Snapshot `PUM-026` cerrado con release útil (2026-04-20):

- Release publicada: `npm publish` -> `+ pumuki@6.3.87`.
- Rollout ejecutado en `Flux_training__chore-pumuki-6-3-86-rollout`: `pnpm add -Dw pumuki@6.3.87`, `pnpm exec pumuki install`, refresh de sesión y repro mínima con `console.log` + `any` staged.
- Resultado final en consumer: `validate PRE_WRITE` -> `exit=1`, `ai_gate.status=BLOCKED`; `pre-commit` -> `exit=1`; `.ai_evidence.json` -> `snapshot.outcome=BLOCK`, `stage=PRE_COMMIT`.
- Conclusión: la divergencia material entre `validate`, hook y evidencia queda cerrada; la task viva pasa a `PUM-027`.
- repo base: línea de release material `release/6.3.86` en worktree limpio `ast-intelligence-hooks__release-6-3-85`.
- parche efectivo:
  - `integrations/lifecycle/preWriteAutomation.ts`: tras reparar solo el receipt MCP, si el gate queda en verde fuerza también refresh de paridad contra `PRE_COMMIT`.
  - `integrations/lifecycle/__tests__/preWriteAutomation.test.ts`: cobertura nueva del caso `MCP receipt repaired -> parity refresh -> blocked`.
- validación unitaria:
  - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/preWriteAutomation.test.ts` -> `7/7` verdes.
- publicación útil:
  - `npm publish` -> `+ pumuki@6.3.87`.
- rollout ejecutado en `Flux_training__chore-pumuki-6-3-86-rollout`:
  - `pnpm add -Dw pumuki@6.3.87`
  - `pnpm exec pumuki install`
  - refresh de sesión y repro mínima con `console.log` + `any` staged.
- resultado final en consumer:
  - `validate PRE_WRITE` -> `exit=1`, `ai_gate.status=BLOCKED`
  - `pre-commit` -> `exit=1`, bloqueo real por `frontend.no-console-log`
  - `.ai_evidence.json` -> `snapshot.outcome=BLOCK`, `stage=PRE_COMMIT`
- conclusión:
  - la divergencia material entre `validate`, hook y evidencia queda cerrada con `pumuki@6.3.87`;
  - la task viva pasa a `PUM-027`.


Snapshot `PUM-027` cerrado con release útil (2026-04-20):

- Release publicada: `npm publish` -> `+ pumuki@6.3.88`.
- Rollout ejecutado en `Flux_training__chore-pumuki-6-3-86-rollout`: `pnpm add -Dw pumuki@6.3.88`, `pnpm exec pumuki install`, refresh de sesión y repro degradada con adapter MCP ausente.
- Resultado final en consumer: borrar `.pumuki/adapter.json` y `.pumuki/artifacts/mcp-ai-gate-receipt.json`, luego `validate PRE_WRITE` -> `exit=1`, `ai_gate.status=BLOCKED`, `automation.actions=[]`, `receipt_exists=no`.
- Conclusión: el flujo MCP degradado deja de aparentar invocaciones reales cuando falta el adapter; la task viva pasa a `PUM-023`.

Snapshot `PUM-023` cerrado con release útil (2026-04-20):

- Release publicada: `npm publish` -> `+ pumuki@6.3.89`.
- Rollout ejecutado en `Flux_training__chore-pumuki-6-3-89-worktree-isolation`: `pnpm add -Dw pumuki@6.3.89`, `pnpm exec pumuki install`, validación de manifest/status y smoke de uninstall.
- Resultado final en consumer: `git config --local --get core.hooksPath` -> `.pumuki/git-hooks`; `git rev-parse --git-path hooks` -> `.pumuki/git-hooks`; `status` y `bootstrap-manifest` resuelven `/Users/juancarlosmerlosalbarracin/Developer/Projects/Flux_training__chore-pumuki-6-3-89-worktree-isolation/.pumuki/git-hooks`; los checksums de `/Users/juancarlosmerlosalbarracin/Developer/Projects/Flux_training/.git/hooks/pre-commit` y `pre-push` permanecen intactos antes y después de `install` / `uninstall`.
- Resultado adicional: `pumuki uninstall` elimina el `core.hooksPath` local del worktree sin tocar los hooks compartidos del checkout principal.
- Conclusión: el aislamiento de hooks por worktree queda cerrado; la task viva pasa a `PUM-020`.

Snapshot `PUM-020` cerrado con release útil y recovery path publicado (2026-04-20):

- Release publicada: `npm publish` -> `+ pumuki@6.3.90`.
- Fix material en la línea de release: `LifecycleNpmService` ya detecta `packageManager`/locks del consumer y traduce `install`/`uninstall` a `pnpm add/remove`, añadiendo `-w` en workspace roots.
- Validación local estricta en `Flux_training__chore-pumuki-update-repro`: con el consumer degradado a `pumuki@6.3.84`, el binario local corregido (`node .../bin/pumuki.js update --latest`) actualiza con `pnpm` y deja el repo en `6.3.89` (`exit=0`).
- Validación publicada: desde el mismo consumer roto en `6.3.84`, `pnpm dlx pumuki@6.3.90 update --latest` actualiza a `6.3.90` (`exit=0`); una vez en `6.3.90`, `pnpm exec pumuki update --latest` vuelve a funcionar y termina en `Already up to date`.
- Conclusión: la línea viva queda reparada y existe recovery path oficial para bins históricos no parcheables; la task viva pasa a `PUM-021`.

Snapshot `PUM-021` cerrado por validación real en línea viva (2026-04-20):

- Validación ejecutada en `Flux_training__chore-pumuki-status-adapter-repro`: `pnpm add -Dw pumuki@6.3.90`, `rm -rf .pumuki`, `pnpm exec pumuki install`, `pnpm exec pumuki status --json`.
- Resultado final en consumer: `.pumuki/adapter.json` existe y `status.governanceObservation.contract_surface.pumuki_adapter_json=true`; `hooksDirectory` resuelve `/Users/juancarlosmerlosalbarracin/Developer/Projects/Flux_training__chore-pumuki-status-adapter-repro/.pumuki/git-hooks`.
- Conclusión: la incidencia ya no reproduce en la línea viva y se cierra como bug histórico resuelto; la task viva pasa a `PUM-025`.

Snapshot `PUM-025` cerrado por validación real en línea viva (2026-04-20):

- Release publicada: `npm publish` -> `+ pumuki@6.3.91`.
- Validación ejecutada en `Flux_training__chore-pumuki-skills-contract-repro`: con rojo frontend staged (`console.log` + `any` en `apps/web/src/main.tsx`), tras `pnpm add -Dw pumuki@6.3.91 && pnpm exec pumuki install`, tanto `pnpm exec pumuki status --json` como `pnpm exec pumuki doctor --json` reportan `governance_effective=blocked`, `skills_contract.enforced=true`, `skills_contract.status=FAIL`, `detected_platforms=[frontend]`, `requirements=4`, `violations=6` y `attention_codes` contiene `SKILLS_CONTRACT_INCOMPLETE`.
- Conclusión: la observabilidad del lifecycle converge con el gate real en consumer publicado; la task viva pasa a `PUM-022`.

Paquete canónico exacto de `6.3.81`:
- `CHANGELOG.md`
- `VERSION`
- `package.json`
- `package-lock.json`
- `scripts/framework-menu-system-notifications-cause.ts`
- `scripts/framework-menu-system-notifications-remediation.ts`
- `scripts/__tests__/framework-menu-system-notifications-cause.test.ts`
- `scripts/__tests__/framework-menu-system-notifications-remediation.test.ts`

Decisión hard de cierre:
- La rama `release/6.3.81` deja de ser candidata de publicación directa: ahora solo conserva el commit validado `9314f24`, pero la versión publicada real en npm es `6.3.97` y no existe rama/worktree local alineado con esa línea.
- La topología GitFlow observable exige promoción como `hotfix/*` desde `main`, no como `release/*` desde `6.3.81`, porque el fix corrige una release ya publicada y `main` local declara `6.3.82` mientras npm ya va por `6.3.97`.
- La promoción local ya quedó ejecutada: existe `hotfix/framework-menu-system-notifications-fallback` desde `main`, con el fix aplicado (`8a002df`) y el bump de release preparado en `6.3.98` (`f1b6356`).
- La fase externa ya avanzó: la rama hotfix está empujada a `origin/hotfix/framework-menu-system-notifications-fallback` y `npm publish` ya dejó `pumuki@6.3.98` en `latest`.
- El único bloqueo restante queda en adopción: `SAAS` está limpio y se puede repinear; `Flux_training` y `R_GO` ya tenían worktrees sucios con cambios ajenos antes del rollout, así que el repin queda bloqueado hasta decidir si se trabaja encima de esos cambios o se aisla otro workspace limpio por consumer.
- El worktree mezclado de `release/6.3.65` queda fuera del cierre de esta release; se archivó en `ast-intelligence-hooks-wip-6.3.81-2026-04-20.tgz` y no puede usarse como fuente de publicación.
- Todo cambio local fuera del paquete anterior (`tracking/evidence/lifecycle`, `consumer-postinstall`, `GitService`, `smoke surface`, textos/payloads adicionales no incluidos en `release/6.3.81`) queda diferido a slices posteriores para evitar regresiones en consumers.

Último cierre: `[✅] - Publicación útil de pumuki@6.3.100 cerrada por GitFlow end-to-end` el siguiente corte de `PUMUKI-INC-079` ya quedó integrado en `main` vía PR [#778](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/778) (`2f0cd9e05bfa30c893f133534b7159083dde5e15`) y publicado en npm como `pumuki@6.3.100`; el replay inmediato en RuralGo ya quedó mergeado vía PR [#1874](https://github.com/SwiftEnProfundidad/R_GO/pull/1874) (`df1bc04b226a5f75aec165697221f3e29728dd01`) y confirma en consumer real `policyValidation.stages.PRE_WRITE.strict=true` y `experimentalFeatures.features.pre_write.mode=strict source=default blocking=true`.

Último cierre operativo: `[✅] - Slice S2.a smoke contractual cruzado entre menú, CLI y MCP` la consola de governance unificada ya queda congelada con un smoke contractual que cruza menú real, CLI real y MCP sobre el mismo contrato visible de `Pre-write` y `Next action`; el cierre queda cubierto con la suite dirigida en verde (`6/6`) dentro de `refactor/s1-governance-console-v2`; este corte quedó mergeado en `develop` vía PR [#773](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/773) con merge `4c23b720632fbd852aa02b7be4abec5a9bd06dd9`.

Último cierre operativo: `[✅] - PUMUKI-INC-115 publicado y repineado` queda integrado en `main` vía PR [#834](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/834) (`10ee8a7e89dab0062368e36a676b2cc69bb0c030`), publicado en npm como `pumuki@6.3.122` y validado en RuralGo con `runtime=consumerInstalled=lifecycleInstalled=6.3.122`; el paquete instalado ya no contiene `GOD_CLASS_MAX_LINES` ni reglas estructurales `God/Massive > N líneas`.

Último cierre operativo: `[✅] - PUMUKI-INC-116 sin thresholds semánticos arbitrarios` queda integrado en `main` vía PR [#835](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/835) (`6eeec2b50f990ea0a0236441f45244d8a45fc6a0`), publicado en npm como `pumuki@6.3.123` y repineado en RuralGo; los detectores iOS/Android/TypeScript sustituyen `relatedNodes.length < N`, `typedCaseCount >= N`, `caseNodes.length < N`, `branchNodes.length < N` y `slice(0,N)` por predicados de responsabilidad/categoría o presencia de alternativas reales; la suite dirigida queda en `149/149` y la auditoría textual no encuentra patrones de thresholds estructurales.

Último cierre operativo: `[✅] - PUMUKI-INC-117 auditoría transversal de umbrales internos en detectores AST core` queda integrado en `main` vía PR [#836](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/836) (`2f00ac55e0829bafea2bbfbda951286ae97e0e91`), publicado en npm como `pumuki@6.3.124` y repineado en RuralGo; LSP iOS/Android ya no usa cardinalidad previa como atajo de decisión y credenciales deja de decidir secretos por longitud hardcodeada; la suite dirigida queda en `140/140` y RuralGo confirma `runtime=consumerInstalled=lifecycleInstalled=6.3.124`.

Último cierre operativo: `[✅] - PUMUKI-INC-118 coherencia de mensajes de bloqueo en notificaciones Pumuki` queda integrado en `main` vía PR #839 (`74e7e9eec64f6372febc7599958e14c005523485`), publicado en npm como `pumuki@6.3.126` y repineado en RuralGo; `status` confirma `runtime=consumerInstalled=lifecycleInstalled=6.3.126` y el bloqueo residual del consumer queda correctamente explicado como governance/tracking (`RGO-1900-01@L53`), no como policy genérica.

Último avance operativo: `[✅] - PUMUKI-INC-120 / DTO validation - class-validator y class-transformer` deja AUTO real `class-validator` + `class-transformer` en facts, preset, registry, markdown, tests y lock con binding AST 1:1 en backend. Evidencia local: suite dirigida `304/304 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `ff8ad27fedb5e4a435f619f5e8a41bd1dcf4f32c7aa84a6c85d97d02a7251b7f`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PUMUKI-INC-120 / DTOs en boundaries - Validación en entrada/salida` deja AUTO real para DTOs de boundary en facts, preset, registry, markdown, tests y lock con binding AST 1:1 en backend. Evidencia local: suite dirigida `309/309 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `a55e1e774239f4ada04545dc21b566d260f28e14fb8ff5a7833b7aa5975dadf9`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PUMUKI-INC-120 / DTOs separados - CreateOrderDto, UpdateOrderDto, OrderResponseDto` deja AUTO real para DTOs separados en facts, preset, registry, markdown, tests y lock con binding AST 1:1 en backend. Evidencia local: suite dirigida `314/314 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `935a0e0426579df42a116cd220b53a566640f70e9ce78820f1b595a66d9530dc`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PUMUKI-INC-120 / Input validation - SIEMPRE validar con DTOs` deja AUTO real para validación de entrada backend en facts, preset, registry, markdown, tests y lock con binding AST 1:1. Evidencia local: suite dirigida `324/324 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `05694d05f9529aea7f8b17ca5b618a8011329cabe2579fe518be75678812bc59`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PUMUKI-INC-120 / Nested validation - @ValidateNested(), @Type()` deja AUTO real para validación anidada de DTOs backend en facts, preset, registry, markdown, tests y lock con binding AST 1:1. Evidencia local: suite dirigida `328/328 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `6761e5870aa837fa8d3928b045904becc7476109fb74222f7fc0d60e9c109983`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PUMUKI-INC-120 / Versionado - /api/v1/, /api/v2/` deja AUTO real para controllers NestJS versionados en facts, preset, registry, markdown, tests y lock con binding AST 1:1. Evidencia local: suite dirigida `328/328 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `6761e5870aa837fa8d3928b045904becc7476109fb74222f7fc0d60e9c109983`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PUMUKI-INC-121 recuperar menú interactivo legacy real` corrige la regresión del menú principal contra el corte histórico `v0-legacy-last` (`scripts/hooks-system/infrastructure/shell/orchestrators/audit-orchestrator.sh`): la portada vuelve a lista plana de 9 opciones (`Full audit`, `Strict REPO+STAGING`, `Strict STAGING only`, `Standard CRITICAL/HIGH`, `Pattern checks`, `ESLint Admin+Web`, `AST Intelligence`, `Export Markdown`, `Exit`), sin `Status`, sin `A`, sin secciones `Export/System` y sin scopes engine visibles. La salida de auditoría vuelve al estilo legacy `summarize_all`: `QUICK SUMMARY`, `PATTERN CHECKS`, `ESLINT AUDIT RESULTS`, `AST INTELLIGENCE - SEVERITY BREAKDOWN`, `PLATFORM-SPECIFIC ANALYSIS`, `TOP VIOLATIONS & REMEDIATION`, `EXECUTIVE SUMMARY`, `AUDIT METADATA` y `FINAL SUMMARY - VIOLATIONS BY SEVERITY`. Evidencia local: suite dirigida `38/38 pass`; `printf '9\n' | node --import tsx scripts/framework-menu.cli.ts` renderiza la portada legacy y sale limpio.

Último avance operativo: `[✅] - PARITY-BACKEND-001 / Retornar DTOs - No exponer entidades directamente` deja AUTO real para retornos directos de entidades backend en facts, preset, registry, markdown, tests y lock con binding AST 1:1. Evidencia local: suite dirigida `379/379 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `69b61eafad23bf114c084443a0256aeb667742a5edadf0f139107487a7dd38b3`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PARITY-BACKEND-001 / Transacciones - Para operaciones críticas y multi-tabla` deja AUTO real para transacciones backend críticas y multi-tabla en facts, preset, registry, markdown, tests y lock con binding AST 1:1. Evidencia local: suite dirigida `386/386 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `60712a8ffc2cdfb08df32bd77476d497075c71c4f5f659ab9723f81690e26bba`; `--check` devuelve `FRESH`.

No queda tarea activa backend abierta en este plan; el baseline backend queda cerrado con las slices ya registradas arriba.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Coroutines - async/await, NO callbacks` cierra la sub-slice con detector AST real Android, enlazado en extractor, preset, registry, markdown, tests y lock. Se conserva la tarea principal activa para seguir con el resto del baseline Android sin mezclar slices. Evidencia local: suite dirigida `187/187 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `20ad5217056ea122aad1405c62ffd888fb9d91b349bd8b9ff237230d86ada53f`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / StateFlow - Estado mutable observable` cierra la sub-slice con detector AST real Android, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `192/192 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `8ba86e2b3cd9affbc0efa3fd86e6a408a5126dd41a732bcb0d0c62d011be7fd0`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / suspend functions - En API service` cierra la sub-slice Android con detector AST real para servicios Retrofit con `suspend fun`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante, ahora con la siguiente pieza lógica en `DAO - Data Access Objects con suspend functions`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / DAO - Data Access Objects con suspend functions` cierra la sub-slice Android con detector AST real para Room DAOs con `suspend fun`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `201/201 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `54dcd9c364511197555474cc39979b5c6287d22f76760db32bfe4cdb5d2a23d1`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / ViewModel - AndroidX Lifecycle ViewModel + Sobrevive cambios de configuración` cierra la sub-slice Android con detector AST real para `ViewModel` en AndroidX, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `207/207 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `1c4813c57273efa8cda9c90f1d653cc9e3974b21c73651d79454805ee6c05ea4`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Use Cases - Lógica de negocio encapsulada` cierra la sub-slice Android con detector AST real para clases `UseCase` con operación pública, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `222/222 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `f480606a7c41771804d49eda911e4cbbe5ab3e76571fc2668c48862a5b7f7aa3`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Repository pattern - Abstraer acceso a datos`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Repository pattern - Abstraer acceso a datos` cierra la sub-slice Android con detector AST real para repositorios que abstraen el acceso a datos, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `298/298 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `26f1b12cf082a3851fc349aa8c4ff0d02699844423023fec22313f9e377dcb1b`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Repository pattern - OrdersRep`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Repository pattern - OrdersRep` cierra la sub-slice Android con detector AST real para la variante OrdersRep del repository pattern, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `298/298 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `26f1b12cf082a3851fc349aa8c4ff0d02699844423023fec22313f9e377dcb1b`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Version catalogs - libs.versions.toml para dependencias`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Version catalogs - libs.versions.toml para dependencias` cierra la sub-slice Android con detector AST real para `libs.versions.toml`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `226/226 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `806b05a5ac5dac4745709686c8b8cf1c8d2de06e4776e538d3b7a2b66251d5bf`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `androidTest - Instrumented tests (Device/Emulator)`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / androidTest - Instrumented tests (Device/Emulator)` cierra la sub-slice Android con detector AST real para pruebas instrumentadas en `androidTest/`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `231/231 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `324178d2b32d6675b852b11c45ea67233113d4a2c42b5ff7733a6b315087118f`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Single Activity - Múltiples Composables/Fragments, no Activities`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Single Activity - Múltiples Composables/Fragments, no Activities` cierra la sub-slice Android con detector AST real para el patrón de single activity y múltiples composables/fragments, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `232/232 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `324178d2b32d6675b852b11c45ea67233113d4a2c42b5ff7733a6b315087118f`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `God Activities - Single Activity + Composables`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / God Activities - Single Activity + Composables` cierra la sub-slice Android con detector AST real para actividades que mezclan shell Compose y composables, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `232/232 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `324178d2b32d6675b852b11c45ea67233113d4a2c42b5ff7733a6b315087118f`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Composable functions - @Composable para UI`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Composable functions - @Composable para UI` cierra la sub-slice Android con detector AST real para funciones `@Composable`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `232/232 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `324178d2b32d6675b852b11c45ea67233113d4a2c42b5ff7733a6b315087118f`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `State hoisting - Elevar estado al nivel apropiado`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Single source of truth - ViewModel es la fuente` cierra la sub-slice Android con detector AST real para ViewModel con estado de fuente única, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `300/300 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `26f1b12cf082a3851fc349aa8c4ff0d02699844423023fec22313f9e377dcb1b`; `--check` devuelve `FRESH`. Siguiente pieza lógica: continuar con el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / State hoisting - Elevar estado al nivel apropiado` cierra la sub-slice Android con detector AST real para elevar estado al nivel adecuado en Compose, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `232/232 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `324178d2b32d6675b852b11c45ea67233113d4a2c42b5ff7733a6b315087118f`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `UiState sealed class - Loading, Success, Error states`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / UiState sealed class - Loading, Success, Error states` cierra la sub-slice Android con detector AST real para `UiState` sealed class con `Loading`, `Success` y `Error`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `218/218 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `74d16d8e8f015c939d0169144f659a7c74d837892a89c306554ae8c677fc2990`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Use Cases - Lógica de negocio encapsulada`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / findViewById - View Binding o Compose` cierra la sub-slice Android con detector AST real para `findViewById` en producción Android, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `162/162 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` devuelve `FRESH: skills.lock.json is fresh.`; el binding canónico ya existía y solo faltaba reflejar el cierre en el tracking. Siguiente pieza lógica: `RxJava - Usar Flow en nuevo código`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / RxJava - Usar Flow en nuevo código` cierra la sub-slice Android con detector AST real para uso de RxJava en producción Android, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `162/162 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` devuelve `FRESH: skills.lock.json is fresh.`; el binding canónico ya existía y solo faltaba reflejar el cierre en el tracking. Siguiente pieza lógica: `Dispatchers - Main/IO/Default`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Dispatchers - Main/IO/Default` cierra la sub-slice Android con detector AST real para `Dispatchers.Main`, `Dispatchers.IO` y `Dispatchers.Default` en producción Android, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `162/162 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` devuelve `FRESH: skills.lock.json is fresh.`; el binding canónico ya existía y solo faltaba reflejar el cierre en el tracking. Siguiente pieza lógica: `withContext - Cambiar dispatcher`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / withContext - Cambiar dispatcher` cierra la sub-slice Android con detector AST real para `withContext` en producción Android, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `162/162 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` devuelve `FRESH: skills.lock.json is fresh.`; el binding canónico ya existía y solo faltaba reflejar el cierre en el tracking. Siguiente pieza lógica: `try-catch - Manejo de errores en coroutines`.

Último avance operativo: `[✅] - PUMUKI-INC-119 baseline enterprise activo por defecto` queda preparado localmente para `pumuki@6.3.127`; `sdd`, `heuristics`, `learning_context`, `analytics`, `operational_memory` y `saas_ingestion` pasan a `strict` por defecto, los mensajes de apagado dejan de decir “por defecto”, y la suite dirigida `npx --yes tsx@4.21.0 --test integrations/policy/__tests__/experimentalFeatures.test.ts integrations/policy/__tests__/heuristicsEnforcement.test.ts integrations/sdd/__tests__/policy.test.ts integrations/lifecycle/__tests__/status.test.ts integrations/lifecycle/__tests__/lifecycle.test.ts integrations/lifecycle/__tests__/cli.test.ts integrations/mcp/__tests__/aiGateCheck.test.ts integrations/mcp/__tests__/preFlightCheck.test.ts integrations/mcp/__tests__/autoExecuteAiStart.test.ts integrations/mcp/__tests__/enterpriseServer.test.ts` queda en `133/133 pass`.

Último avance operativo: `[✅] - PUMUKI-INC-119 cobertura stage-aware e IDs de auditoría` queda validado localmente en rama `bugfix/pumuki-inc-119-stage-aware-audit-coverage`: `loadSkillsRuleSetForStage` deja de convertir reglas DECLARATIVE en reglas runtime falsas y PRE_COMMIT ya no arrastra reglas mínimas PRE_PUSH; `snapshot.rules_coverage` añade `contract=AUTO_RUNTIME_RULES_FOR_STAGE`, totales del registry, `stage_applicable_auto_rule_ids`, motivo de exclusión DECLARATIVE y nota de alcance; `pumuki audit --json` expone `rule_id_normalization` con estados `registry_1_to_1` o `runtime_derived`; el menú deja de llamar a la opción 14 `FULL tracked repo` y pasa a `tracked repo files (AUTO runtime rules · PRE_COMMIT)`. Suite dirigida: `24/24 pass`. Validación real en RuralGo con binario local: `files_scanned=1790`, `snapshot_outcome=WARN`, `rules_coverage.registry_totals={total:814,auto:56,declarative:758}`, `stage_applicable_auto=30`, `coverage_ratio=1`, `rule_id_normalization.entries` presente.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / SharedFlow - Hot stream, puede no tener valor, para eventos` cierra la sub-slice Android con detector AST real para `SharedFlow`/`MutableSharedFlow` en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. Evidencia local: suite dirigida `242/242 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `bcb6030ada989c671a49365c5a99b08c0d05ecf13bb742b1faf3fc5a508cb354`; `--check` devuelve `FRESH`. La tarea principal sigue activa para continuar con el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Flow builders - flow { emit() }, flowOf(), asFlow()` cierra la sub-slice Android con detector AST real para builders de `Flow` en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. Evidencia local: suite dirigida `242/242 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `bcb6030ada989c671a49365c5a99b08c0d05ecf13bb742b1faf3fc5a508cb354`; `--check` devuelve `FRESH`. La tarea principal sigue activa para continuar con el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / collect-terminal-operator-para-consumir-flow` cierra la sub-slice Android con detector AST real para consumo terminal de `Flow` en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. Evidencia local: suite dirigida `247/247 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `c873c243286bbcd12a52394b31d701862cd99797dd67dd1df3e267da78c76ac5`; `--check` devuelve `FRESH`. La tarea principal sigue activa para continuar con el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / remember - Evitar recrear objetos` cierra la sub-slice Android con detector AST real para `remember` en Compose en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `257/257 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `1a36cfdc656afb6fbb5a29ded4e3673e8fade3db61988b04b0e6589a6df661b2`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `derivedStateOf - Cálculos caros solo cuando cambia input`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / derivedStateOf - Cálculos caros solo cuando cambia input` cierra la sub-slice Android con detector AST real para `derivedStateOf` en Compose en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. El lock deja también `derivedStateOf - Cálculos derivados de state` en `AUTO`, sin dejar bindings colgando. Evidencia local: suite dirigida `121/121 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `73b00732e1aff342b3866cba79c5cb8a010468971b662b22c082726e4c6ad4e4`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `LaunchedEffect - Side effects con lifecycle`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / LaunchedEffect - Side effects con lifecycle` cierra la sub-slice Android con detector AST real para `LaunchedEffect` en Compose en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. Evidencia local: suite dirigida `268/268 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `9da90960344e3651b1af9118be24e1ef56dc51084b83edf819af07490a6385ad`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `LaunchedEffect keys - Controlar cuándo se relanza effect`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / DisposableEffect - Cleanup cuando Composable sale de composición` cierra la slice Android con detector AST real para `DisposableEffect` en Compose en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. Evidencia local: suite dirigida `278/278 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `eafa68e375d4f6e04f2e45068a17cc07d6eb58c8e6db1f82b8753e11ed16fe3e`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Recomposition - Composables deben ser idempotentes`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Recomposition - Composables deben ser idempotentes` cierra la sub-slice Android con detector AST real para composables no idempotentes en Compose en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. Evidencia local: suite dirigida `283/283 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `9b282e0152eae5872790c6a04e6f586e3e3c6e02165d41466c98e33f3ffe48a7`; `--check` devuelve `FRESH`. La tarea principal sigue activa para continuar con el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Preview - @Preview para ver UI sin correr app` cierra la sub-slice Android con detector AST real para `@Preview` en Compose en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. Evidencia local: suite dirigida `288/288 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `fec84e2b064505f59b66fcaf0bb27401ec15b56d72f47d721427a749edd0d4cb`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `remember - Para mantener estado entre recomposiciones`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / remember - Para mantener estado entre recomposiciones` cierra la sub-slice Android con detector AST real para `remember` estable entre recomposiciones en producción Kotlin, enlazado en extractor, preset, registry, markdown, tests y lock. Evidencia local: suite dirigida `290/290 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `c10f03d9d6136d752cf1396897a6d858182a8580cd674989fdc74f47bfb9a3ff`; `--check` devuelve `FRESH`. La tarea principal sigue activa para continuar con el baseline Android restante.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` arranca en rama `bugfix/pumuki-inc-120-all-skills-auto-ast-coverage` tras detectar que el lock efectivo de RuralGo tiene `814` reglas únicas (`56 AUTO`, `758 DECLARATIVE`) y `832` entradas efectivas. Distribución de deuda declarativa: iOS `294`, Android `203`, Backend `137`, Frontend `90`, Generic `34`. Regla hard nueva: esas `758` no son cierre aceptable; deben convertirse a `AUTO` con detector AST inteligente o generar deuda bloqueante de detector faltante por regla.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` queda validado localmente contra RuralGo con el binario de esta rama: `pumuki audit --stage=PRE_COMMIT --json` pasa de ocultar deuda declarativa a exponer `rules_coverage.counts.unsupported_detector=754`, `registry_total=814`, `registry_auto=56`, `registry_declarative=758`, `gate_exit_code=1`, `snapshot_outcome=BLOCK` y `blocking_findings_count=3`. Cambio de contrato aplicado: `PUMUKI_SKILLS_ENFORCEMENT`, `PUMUKI_HEURISTICS_ENFORCEMENT`, `PUMUKI_TDD_BDD_ENFORCEMENT`, `PUMUKI_SDD_ENFORCE_COMPLETENESS` y `PUMUKI_GIT_ATOMICITY_ENFORCEMENT` quedan en `strict` por defecto; `advisory`/`0` queda solo como opt-in legacy explícito. Suites dirigidas: gate/policy/SDD `103/103 pass`, stage runners `49/49 pass`, lifecycle watch `9/9 pass`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` completa segunda tanda de normalización sin hardcodes de umbral: `skillsMarkdownRules.ts` solo convierte frases equivalentes hacia detectores ya existentes en `skillsDetectorRegistry.ts` y deja como `DECLARATIVE/unsupported_detector` lo que aún no tiene detector 1:1. Tanda cerrada: equivalencias backend/frontend para SOLID, Clean Architecture, God Class, empty catch, console log y explicit any; equivalencias iOS seguras para `No force unwrapping` y `XCTest solo para proyectos legacy / New XCTest-only unit tests`. Android queda sin descenso porque los pendientes visibles (`!!`, strings, dispatchers, coroutines) no tienen detector registrado equivalente y deben resolverse creando detectores nuevos, no con mapping falso. Evidencia local: suite compiler/registry `34/34 pass`; `npm run skills:compile` genera hash `f381c289edf74db9b2885f9569c26b50661a3c06f5454b258538f82466a6ad30`; lock local queda en `749` entradas, `730` IDs únicos, `75 AUTO` y `674 DECLARATIVE` (`iOS 60 AUTO/258 DECLARATIVE`, `Android 3/203`, `Backend 6/129`, `Frontend 6/84`). Nota de rollout: RuralGo seguirá viendo `unsupported_detector=754` hasta publicar/repinear esta rama; el lock local ya muestra la reducción contractual.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` añade el primer detector nuevo Android de la tanda: `skills.android.no-force-unwrap` se enlaza a `heuristics.android.force-unwrap.ast`, con detección Kotlin de `!!` en código real y descarte de comentarios, strings y `!=`. La ruta completa queda cubierta en detector textual inteligente, extracción de facts, preset heurístico, registry de skills y normalización markdown. Evidencia: suite enfocada detector/facts/preset/compiler `85/85 pass`; `npm run skills:compile` genera hash `3063b3b201ea9100054fcd8505b4526ccce68bccd5196f28ca91b73d2a925369`; lock local queda en `748` entradas, `729` IDs únicos, `76 AUTO` y `672 DECLARATIVE`; Android baja a `4 AUTO/201 DECLARATIVE`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` añade segundo detector nuevo Android: `skills.android.no-java-new-code` se enlaza a `heuristics.android.java-source.ast`, detectando código Java real en producción Android y excluyendo tests, comentarios y strings. Evidencia: suite enfocada detector/facts/preset/compiler `88/88 pass`; `npm run skills:compile` genera hash `8efa89250acc2ceeabe0430b44c8fcd78b55efd9f8facdd0d1255475b3c6c059`; lock local queda en `747` entradas, `728` IDs únicos, `77 AUTO` y `670 DECLARATIVE`; Android baja a `5 AUTO/199 DECLARATIVE`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` añade tercer detector Android en esta tanda: `skills.android.asynctask-deprecated-usar-coroutines` se enlaza a `heuristics.android.asynctask-deprecated.ast`, detectando `AsyncTask` real en producción Android y excluyendo comentarios, strings y nombres parciales. Evidencia: suite enfocada detector/facts/preset/compiler `91/91 pass`; `npm run skills:compile` genera hash `dac643cd39ce1a5b62002966e699bad7f9313ba854896a747bc7e66a82f657e1`; lock local queda en `747` entradas, `728` IDs únicos, `78 AUTO` y `669 DECLARATIVE`; Android sube a `6 AUTO/198 DECLARATIVE`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` añade cuarto detector Android en esta tanda: `skills.android.rxjava-new-code` se enlaza a `heuristics.android.rxjava-new-code.ast`, detectando uso real de RxJava en código Android de producción y excluyendo comentarios, strings y nombres parciales. La normalización markdown también lo resuelve desde `RxJava` / `usar Flow en nuevo código` a la skill canónica. Evidencia: suite enfocada detector/facts/preset/compiler `81/81 pass`; `npm run skills:compile` genera hash `f4a140157079c31072bee8b482a8a795efa13062a9099fed2c5e3a7c2a0d4e83`; lock local queda en `735` entradas, `716` IDs únicos, `80 AUTO` y `655 DECLARATIVE`; Android queda en `8 AUTO/184 DECLARATIVE`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` añade quinto detector Android en esta tanda: `skills.android.dispatchers-main-ui-io-network-disk-default-cpu` se enlaza a `heuristics.android.dispatchers-main-ui-io-network-disk-default-cpu.ast`, detectando `Dispatchers.Main/IO/Default` real en código Android de producción y excluyendo comentarios, strings y nombres parciales. La normalización markdown también lo resuelve desde `Dispatchers` y `withContext` a la skill canónica. Evidencia: suite enfocada detector/facts/preset/compiler `84/84 pass`; `npm run skills:compile` genera hash `eeab2709ae922259471b1b9a27deca44545a2283780ff9afb9c7ab2b65380510`; lock local queda en `733` entradas, `714` IDs únicos, `81 AUTO` y `652 DECLARATIVE`; Android queda en `9 AUTO/181 DECLARATIVE`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` añade sexto detector Android en esta tanda: `skills.android.withcontext-change-dispatcher` se enlaza a `heuristics.android.withcontext-change-dispatcher.ast`, detectando `withContext` real en código Android de producción y excluyendo comentarios, strings y nombres parciales. La normalización markdown también lo resuelve desde `withContext` / `cambiar dispatcher` a la skill canónica. Evidencia: suite enfocada detector/facts/preset/compiler `87/87 pass`; `npm run skills:compile` genera hash `54782c9dceffc0f7a2fc919c5e0dca2c037ad738d180412c5469db74c78e7b36`; lock local queda en `734` entradas, `715` IDs únicos, `82 AUTO` y `652 DECLARATIVE`; Android queda en `10 AUTO/181 DECLARATIVE`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `try-catch - Manejo de errores en coroutines` con detector AST real Android, sin normalización falsa ni bloqueo por ausencia de superficie de código. Evidencia: suite dirigida `90/90 pass`; `npm run skills:compile` genera hash `636336a255bf39c009283030bca80c14fdb015a9e84eaed6a9f88955c083ef5a`; lock local queda recompilado con la nueva regla `skills.android.try-catch-manejo-de-errores-en-coroutines` enlazada a `heuristics.android.try-catch-manejo-de-errores-en-coroutines.ast`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.android.no-console-log` en Android con detector real de logging y excepción explícita `BuildConfig.DEBUG`, sin dejar la regla como guideline inventada. Evidencia: suite dirigida `99/99 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `3847f41ea25a385a9d63f523e7881fb7f60ea0b5feb3cb211b44c7cdc48ee579`; lock local deja `skills.android.no-console-log` como id canónico y elimina el generated id legacy `skills.android.guideline.android.no-logs-en-produccio-n-if-buildconfig-debug-timber-d`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.android.hardcoded-strings-usar-strings-xml` en Android con detector real de literales de cadena y normalización explícita hacia `strings.xml`, sin tocar la regla positiva de localización. Evidencia: suite dirigida `102/102 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `fe7a965f7d97c77bd86bfffed8fe013999b32e17b73ab75a020485b152fa41cc`; lock local deja `skills.android.hardcoded-strings-usar-strings-xml` como id canónico y absorbe el guideline legacy generado.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.no-singleton` y `skills.frontend.no-singleton` con un detector AST compartido para patrón singleton, enlazado en facts, registry, markdown, tests y lock. Evidencia: suite dirigida `124/124 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `3460ec1ba7548ec8f585a14703243af605ccd9f110423ee1610a164e1d4df8c8`; lock local deja ambas reglas como ids canónicos AUTO y no conserva guideline legacy para singleton en backend/frontend.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.callback-hell-usar-async-await` y `skills.frontend.callback-hell-usar-async-await` con un detector AST compartido para callback hell real, enlazado en facts, registry, markdown, tests y lock. Evidencia: suite dirigida `128/128 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `e5d43d070893ec769901d79d2f26435dd156cc92e80ac335f9fb8a9c627f90f4`; lock local deja ambas reglas como ids canónicos AUTO y no conserva guideline legacy para callback hell en backend/frontend.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.magic-numbers-usar-constantes-con-nombres-descriptivos` con un detector AST real para literales numéricos en runtime TypeScript, enlazado en facts, registry, markdown, tests y lock. Evidencia: suite dirigida `130/130 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `e8f04cc2d3caf21469cfdde9f234ae9f85110b10dae084bbafd029f94559ca1b`; lock local deja la regla como id canónico AUTO y mantiene el guideline legacy backend como declarativo mientras el detector cubre la superficie runtime real.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.hardcoded-values-config-en-variables-de-entorno` con un detector AST real para valores de configuración hardcodeados en TypeScript backend, enlazado en facts, registry, markdown, tests y lock. Evidencia: suite dirigida `132/132 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `51365637e12ac7a43cf49a5a47c7bc67917022aec0a25d669f084b84745a0997`; lock local deja la regla como id canónico AUTO y mantiene el guideline legacy backend como declarativo mientras el detector cubre la superficie runtime real.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.no-defaults-en-produccio-n-fallar-si-falta-config-cri-tica` con un detector AST real para fallbacks implícitos sobre `process.env` en backend de producción, enlazado en facts, registry, markdown, tests y lock. Evidencia: suite dirigida `134/134 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `cfe39425937dab582a587f5cb343d509eefb2c9fdef51c14b006ffd5a3d0a088`; lock local deja la regla como id canónico AUTO y mantiene el guideline legacy backend como declarativo mientras el detector cubre la superficie runtime real.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.no-god-classes` y `skills.frontend.no-god-classes` con un detector AST semántico para God Class, enlazado en facts, registry, markdown y rule set con payload de clase, líneas y responsabilidades visibles. Evidencia: suite dirigida `130/130 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` confirma `FRESH: skills.lock.json is fresh.`; el lock ya mantenía ambas reglas como ids canónicos AUTO y la integración backend/frontend queda cubierta con `primary_node`, `related_nodes`, `why`, `impact` y `expected_fix` accionables.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` mejora `skills.backend.no-console-log` y `skills.frontend.no-console-log` con un detector AST semántico para `console.log`, enlazado en facts con owner visible, línea propia y recomendación de fix controlada. Evidencia: suite dirigida `130/130 pass` tras añadir `findConsoleLogCallMatch` y las pruebas de payload; el lock permanece fresco y no requiere regeneración porque el binding canónico ya existía.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` mejora `skills.backend.avoid-explicit-any` y `skills.frontend.avoid-explicit-any` con un detector AST semántico para `any` explícito, enlazado en facts con owner visible, línea propia y recomendación de fix controlada. Evidencia: suite dirigida `132/132 pass` tras añadir `findExplicitAnyTypeMatch` y las pruebas de payload; el lock permanece fresco y no requiere regeneración porque el binding canónico ya existía.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` mejora `skills.backend.no-empty-catch` y `skills.frontend.no-empty-catch` con un detector AST semántico para catch vacíos, enlazado en facts con owner visible, línea propia y recomendación de fix controlada. Evidencia: suite dirigida `134/134 pass` tras añadir `findEmptyCatchClauseMatch` y las pruebas de payload; el lock permanece fresco y no requiere regeneración porque el binding canónico ya existía.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.enforce-clean-architecture` y `skills.frontend.enforce-clean-architecture` con un detector AST semántico para Clean Architecture, enlazado en facts, registry, markdown, rule set y lock con payload de riesgo de dependencia concreta. Evidencia: suite dirigida `140/140 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` confirma `FRESH: skills.lock.json is fresh.`; el lock mantiene ambas reglas como ids canónicos AUTO y el extractor ya emite `heuristics.ts.clean-architecture.ast` en backend/frontend de producción.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.mocks-en-produccio-n-solo-datos-reales` con un detector AST semántico para mocks de producción backend, enlazado en facts, registry, markdown, bundle backend y lock con payload de sustitución de dependencias reales por dobles. Evidencia: suite dirigida `151/151 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `e524f81e05c0a116bb67fe65c4fd3b2a625247c023187307219a26f42835d123`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.production-mock.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.exception-filters-catch-para-manejo-global` con un detector AST semántico para filtros globales de excepciones backend, enlazado en facts, registry, markdown, bundle backend y lock con payload de manejo centralizado de errores. Evidencia: suite dirigida `155/155 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `3be2d0c4d58c7399a2722cdcb6c148693c6f4b54370fcd1e79f40c3474816a88`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.exception-filter.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.guards-para-autenticacio-n-autorizacio-n-useguards-jwtauthguard` con un detector AST semántico para `@UseGuards(JwtAuthGuard)` backend, enlazado en facts, registry, markdown, bundle backend y lock con payload de protección explícita de rutas. Evidencia: suite dirigida `160/160 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `fd477037c548827df30d58c95a1bf90ca2ce9b0670109198dca49a24f05ffbeb`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.guards-useguards-jwtauthguard.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.interceptors-para-logging-transformacio-n-no-en-cada-endpoint` con un detector AST semántico para `@UseInterceptors` en backend, enlazado en facts, registry, markdown, bundle backend y lock con payload de logging/transformación transversal. Evidencia: suite dirigida `165/165 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `244a38f870275a20933a119e7b315cabf3707d48ae87e450c0069c023459e701`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.interceptors-useinterceptors-logging-transform.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.no-loggear-datos-sensibles-passwords-tokens-pii` con un detector AST semántico para logs con datos sensibles en backend, enlazado en facts, registry, markdown, bundle backend y lock con payload de passwords/tokens/PII visibles en runtime. Evidencia: suite dirigida `169/169 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `1aa93876f89779d408b818bfe35a7d769a1fe336dff31397d84e1e75e3d3dff7`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.no-sensitive-log.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.password-hashing-bcrypt-con-salt-rounds-10` con un detector AST real para bcrypt salt rounds inseguros en backend, enlazado en facts, registry, markdown, preset generic y lock con payload de hashing débil visible en runtime. Evidencia: suite dirigida `173/173 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `8db3c824ed6bc0ebd23304ae2fc928bc7b8d88ac398803adf1a53a9b361f0d56`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.password-hashing-bcrypt-salt-rounds-10.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.guideline.backend.rate-limiting-nestjs-throttler-para-prevenir-brute-force` y `skills.backend.guideline.backend.rate-limiting-throttler-para-prevenir-abuse` con un detector AST real para NestJS throttler rate limiting en backend, enlazado en facts, registry, markdown, preset generic y lock con payload de protección frente a brute force y abuso. Evidencia: suite dirigida `177/177 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `c16edf7525673c83e645de6e504e8ebf8941a9fb14b90ad7a93aa3d38cf3e311`; el lock mantiene ambas reglas como ids canónicos AUTO y el extractor emite `heuristics.ts.rate-limiting-throttler.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.guideline.backend.winston-logger-estructurado-json-logs` con un detector AST semántico para Winston JSON structured logging en backend, enlazado en facts, registry, markdown, preset generic y lock con payload de logger estructurado visible en runtime. Evidencia: suite dirigida `103/103 pass`; `node --import tsx scripts/compile-skills-lock.ts` generó hash `75b0ee167eb701f701658b338a875c938d622fe7936a13e321f86b143daaed92`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.winston-structured-json-logger.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.guideline.backend.me-tricas-prometheus-prom-client-para-me-tricas` con un detector AST semántico para `prom-client` en backend, enlazado en facts, registry, markdown, preset generic y lock con evidencia de métricas Prometheus operativas. Evidencia: suite dirigida `148/148 pass`; `node --import tsx scripts/compile-skills-lock.ts` generó hash `82227e4cd4474aaa4cf9477fdc94d3f41a40664cda0dbf5566b98be4995bb799`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.prometheus-prom-client.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.backend.guideline.backend.validation-de-config-joi-o-class-validator-para-env` con un detector AST semántico para `ConfigModule.forRoot({ validationSchema / validate })` en backend, enlazado en facts, registry, markdown, preset generic y lock con evidencia de validación de env operativa. Evidencia: suite dirigida `199/199 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `9383db4ecf13e0193a46bf57db6ea95cd2862d054054d069c0ca719910b46b23`; el lock mantiene la regla como id canónico AUTO y el extractor emite `heuristics.ts.validation-config.ast` solo en `apps/backend/`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra `skills.android.no-solid-violations` y `skills.android.enforce-clean-architecture` con bindings Android a los heurísticos estructurales ya existentes de SOLID/Clean Architecture, enlazados en facts, registry, markdown y lock con payload de layering y responsabilidades visibles. Evidencia: suite dirigida `58/58 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `43f1f03b6a33fad6240e83800aa50606dbd49d4f0e82d50fb8382f4c1b492234`; `node --import tsx scripts/compile-skills-lock.ts --check` confirma `FRESH: skills.lock.json is fresh.`; el lock mantiene ambas reglas como ids canónicos AUTO con `stage=PRE_PUSH`.

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` cierra la tanda Android Hilt/DI: `skills.android.guideline.android.hilt-com-google-dagger-hilt-android`, `skills.android.guideline.android.hilt-di-framework-no-manual-factories`, `skills.android.guideline.android.hiltandroidapp-application-class`, `skills.android.guideline.android.androidentrypoint-activity-fragment-viewmodel`, `skills.android.guideline.android.inject-constructor-constructor-injection`, `skills.android.guideline.android.module-installin-provide-dependencies` y `skills.android.guideline.android.viewmodelscoped-para-dependencias-de-viewmodel` pasan a `AUTO` con detector textual Android, extractor, registry, markdown, bundle Android y lock recompilado. Evidencia: suite dirigida `130/130 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `36a6918d2842d07a9a2add0ddebca239cea14f2a26d1f70a5cd26e9b6038a025`; `node --import tsx scripts/compile-skills-lock.ts --check` confirma `FRESH: skills.lock.json is fresh.`

Último avance operativo: `[✅] - PUMUKI-INC-120 cobertura AST AUTO para todas las skills/reglas` amplía el bundle TypeScript genérico con detectores AST reales para backend/frontend: callback hell, magic numbers, hardcoded values, env defaults, guards, interceptors, logs sensibles, rate limiting, Winston, correlation IDs, CORS, ValidationPipe, Prometheus, bcrypt, Clean Architecture, singleton, empty catch, console.log y explicit any. La ruta queda enlazada en detector, preset, registry, markdown, rule set y tests de regresión; evidencia local: suite dirigida `221/221 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `2001be19a847dff5233a4563a9b8e6aab475aaadee7098e8d76c6c30749d47d1`; `--check` devuelve `FRESH`. Siguiente pieza lógica: seguir absorbiendo los gaps restantes del bundle TypeScript/backend/frontend sin reintroducir declaraciones falsas.

Backlog explícito de producto pendiente:
- `[✅] - PUMUKI-INC-121 recuperar menú interactivo legacy real`: el menú principal vuelve a la experiencia legacy pedida, con navegación interactiva clara, jerarquía visual útil, opciones primarias comprensibles y paridad funcional sin degradar el flujo enterprise.
- `[✅] - PUMUKI-INC-122 rehacer notificaciones Pumuki accionables`: las notificaciones actuales ya explican causa, impacto, comando exacto y next action sin duplicar etiquetas ni mensajes genéricos.

Regla operativa persistente: este repositorio no dispone de cuota útil de GitHub Actions en el ciclo actual; durante rollout/release se crean las PR necesarias y se mergean igualmente sin esperar CI remoto. La validación contractual pasa a ser local/dirigida y cualquier bloqueo de branch policy por checks remotos debe resolverse por merge administrativo, no reabriendo el debate sobre esperar Actions.

Barrido de consumers cerrado:
- SAAS (`pumuki@6.3.98`): rollout ejecutado en `chore/pumuki-6-3-98-rollout`, follow-up de pin exacto (`52bb5d3`) y PR [#11](https://github.com/SwiftEnProfundidad/app-supermercados/pull/11) ya mergeada en `main` con squash `6bdd18404358319b20b594c3a2193799eabe4dab` (`2026-04-21T19:04:27Z`). `install/status/doctor` convergieron en verde y el hilo de review sobre `^6.3.98` quedó resuelto antes del merge.
- Flux (`pumuki@6.3.98`): rollout aislado en `Flux_training__chore-pumuki-6-3-98-rollout`, repin exacto (`f0ec81e`) y PR [#8](https://github.com/SwiftEnProfundidad/flux-training/pull/8) ya mergeada en `develop` con squash `945d46e3a1c06497f08a0875d62974a5429095cb` (`2026-04-21T19:04:07Z`). `install/status/doctor` convergieron en verde y `Vercel` quedó en success antes del merge.
- RuralGo (`pumuki@6.3.98`): rollout aislado en `R_GO__chore-pumuki-6-3-98-rollout`, follow-up de pin exacto (`3a630d7a6`), merge de reconciliación con `origin/develop` (`c27131cab`) y PR [#1872](https://github.com/SwiftEnProfundidad/R_GO/pull/1872) ya mergeada en `develop` con squash `9f79178cfade18ab76be48656077f71f0f063e1f` (`2026-04-21T19:04:10Z`). `install/status/doctor` convergieron en verde; el repin se ejecutó con `engine-strict=false` solo para sortear el shell Node 25 de Codex, sin dejar divergencia funcional en el consumer.
- Adopción: `pumuki@6.3.98` ya quedó publicada y mergeada en los tres consumers activos, sin bugs externos abiertos derivados del rollout.

Snapshot de adopción vigente:

| Consumer | Versión/estado actual | Estado backlog externo | Lectura operativa |
|----------|------------------------|------------------------|-------------------|
| `SAAS` | `6.3.98` mergeada vía [#11](https://github.com/SwiftEnProfundidad/app-supermercados/pull/11) | `0` incidencias activas | Adopción cerrada en `main`. |
| `RuralGo` | `6.3.98` mergeada vía [#1872](https://github.com/SwiftEnProfundidad/R_GO/pull/1872) | `0` incidencias activas en backlog Pumuki | Adopción cerrada en `develop`. |
| `Flux` | `6.3.98` mergeada vía [#8](https://github.com/SwiftEnProfundidad/flux-training/pull/8) | sin bug nuevo abierto en backlog Pumuki | Adopción cerrada en `develop`. |

*(Sustituir la fila anterior al cerrar/abrir la tarea en curso: una sola 🚧 en todo el plan.)*

---

## Checklist rápido “¿está reflejado el informe?”

- [x] §1–3 exigencias y política dueño → RG-COMP + P0/P1
- [x] §4 MCP expectativa → RG-P1-3, RG-P3-9, USAGE
- [x] §5 pumukiHooks → RG-P1-5
- [x] §6 evidencia / LLM no carga → RG-P1-4, RG-P0-1
- [x] §7 pre-commit / worktree → RG-P2-6,7 + remediation
- [x] §8 `--no-verify` / CI → RG-P0-2, RG-F
- [x] §9 AGENTS vs dueño → precedencia en AGENTS (seguimiento documental ✅)
- [x] §10 P0–P3 → tabla backlog
- [x] §11 cierre / feedback → RG-OPS-01
- [x] §12 markdown + parche → **RG-P2-12** (antes no estaba en el plan mínimo)

Cuando una fila pase a ✅, añadir en la misma celda la referencia (commit, versión `pumuki`, o PR).

---

Último avance operativo: `[✅] - PARITY-ANDROID-001 / WorkManager - androidx.work:work-runtime-ktx y WorkManager - Background tasks` cierra la sub-slice Android con detector AST real para la dependencia `androidx.work:work-runtime-ktx` y para workers de `WorkManager` con `doWork()`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite focalizada `308/308 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `ebdb33192df4e93b356d3c9451996ba43f0ce74bfbd4c9e262044be38c74ecac`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / AAA pattern - Arrange, Act, Assert / Given-When-Then - BDD style / test/ - Unit tests (JVM)` cierra la sub-slice Android con detector AST real para testing estructurado en `androidTest/` y `test/`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `317/317 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `f59464b7b78b5c258dc9622b6a0cd69a081cbfa67087bfcc77a5cfd4f8dfecf0`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Theme - Color scheme, typography, shapes` cierra la sub-slice Android con detector AST real para `MaterialTheme` con `colorScheme`, `typography` y `shapes`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `320/320 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `7865c649d636dc5fca0af68ef667dc030d8cdffc980cf5a72ccd38a5d8254eea`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Dark theme - Soportar desde día 1 (isSystemInDarkTheme())`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Dark theme - Soportar desde día 1 (isSystemInDarkTheme())` cierra la sub-slice Android con detector AST real para soporte de tema oscuro en Compose, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `324/324 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `7865c649d636dc5fca0af68ef667dc030d8cdffc980cf5a72ccd38a5d8254eea`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Accessibility - semantics, contentDescription` cierra la sub-slice Android con detector AST real para accesibilidad en Compose mediante `contentDescription` y `Modifier.semantics`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `327/327 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `512232919a803211db8b3a41beae617b9f8f8e0658c3151d194ecda65bf0544d`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / contentDescription - Para imágenes y botones` cierra la sub-slice Android con detector AST real para `contentDescription` en iconos, imágenes y botones dentro de Compose, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `330/330 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `111cbe30fd3347fb28bb70f0c0cd9bb05e76f2a19609033d07d74b44016edbc4`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `TalkBack - Screen reader de Android`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Plurals - values/plurals.xml` cierra la sub-slice Android con detector AST real para `plurals.xml` localizado, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `344/344 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `008dfabea5dd0c22dde4c1558b91b040391d4312762df4efe3b0b09681e75e6a`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / @Binds - Para implementaciones de interfaces (más eficiente)` cierra la sub-slice Android con detector AST real para `@Binds` en módulos Hilt con `@Module` + `@InstallIn`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `348/348 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `e4060d0414c920a47d618b64ebf93e401c7814058133a1e44b737922c69bfe96`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `@Provides - Para interfaces o third-party`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / @Provides - Para interfaces o third-party` cierra la sub-slice Android con detector AST real para `@Provides` en módulos Hilt con `@Module` + `@InstallIn`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `352/352 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `2001be19a847dff5233a4563a9b8e6aab475aaadee7098e8d76c6c30749d47d1`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / BuildConfig - Constantes en tiempo de compilación` cierra la sub-slice Android con detector AST real para `BuildConfig.<CONST>` en código de producción, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `374/374 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `9f9b70216adcdc5ece2d3e449c9335b7180f627cf1eddf7c2b64d360d65683cc`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Adaptive layouts - Responsive design (WindowSizeClass)` cierra la sub-slice Android con detector AST real para layouts adaptativos en Compose mediante `WindowSizeClass`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `378/378 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `540c4b41e73b3116a80ac10b8be2508de3409f8e2e1e6cc2ea44a74b82c5381f`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Analizar estructura existente - módulos, interfaces, dependencias Gradle`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Analizar estructura existente - Módulos, interfaces, dependencias, Gradle` cierra la sub-slice Android con detector AST real para estructura existente en Kotlin y Gradle, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `384/384 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `f0b8d3c3a6816b89b53da4fdc81d13e53a5edab92d6507d416c6158057ab2b24`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Timber - Logging library` cierra la sub-slice Android con detector AST real para Timber logging en producción, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `388/388 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `95c0f2a411101955734ab804d916cb530b3d171bab9a250e4e6e61acc8cdf7da`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Analytics - Firebase Analytics o custom` cierra la sub-slice Android con detector AST real para instrumentación de analytics en producción, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `425/425 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `f66e1ac6319de47468218fe15ff0ecb83aebd36ae90506441e04d66af11b1002`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Android Profiler - CPU, Memory, Network profiling` cierra la sub-slice Android con detector AST real para Android Profiler en producción, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `429/429 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `b482c42f3c66ae060c68379529136be2432c0af0888226f815e31e75d1b5e125`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Touch targets - mínimo 48dp` cierra la sub-slice Android con detector AST real para touch targets mínimos en Compose, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `391/391 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `324a792c3651e3fc901a9fadcfab5159182a3e41acbb281f41730f76683d032e`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / @Transaction - Para operaciones multi-query` cierra la sub-slice Android con detector AST real para Room transaccional, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `395/395 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `a307fabe668c62919fcff0330a19fcb9f7750a14b818deb759ae8ad3ecef00b7`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / viewModelScope - Scope de ViewModel, cancelado automáticamente` cierra la sub-slice Android con detector AST real para `viewModelScope`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `402/402 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `e46572fce33e5c4fba777d751bbf6693156c2e498e84a65721d683541209cb4c`; `--check` devuelve `FRESH`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / App startup - androidx.startup para lazy init` cierra la sub-slice Android con detector AST real para `androidx.startup` en inicialización lazy, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `402/402 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `7d122fbe1cc05b1e4e13efb5706aab0fd93f595308a83aab34308a5490443eb5`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Baseline Profiles - Optimización de startup`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Baseline Profiles - Optimización de startup` cierra la sub-slice Android con detector AST real para `BaselineProfileRule` en instrumented tests, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `407/407 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `f5675769a7a65b8598f2aa3b7b771409a31457a6bd503dd9f54aaae2c2573c74`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Single source of truth - ViewModel es la fuente`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Skip recomposition - Parámetros inmutables o estables` cierra la sub-slice Android con detector AST real para parámetros estables o inmutables en Compose, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `412/412 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `cbabc380245aa89db842ccc96102ff57026d7415f73bd050f77c916f13f74abd`; `--check` devuelve `FRESH`. Siguiente pieza lógica: `Stability - Composables estables recomponen menos`.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Stability - Composables estables recomponen menos` cierra la sub-slice Android con detector AST real para modelos Compose estables o inmutables usados como entrada de composables, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `417/417 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `042c19b0748f862f0c19cc9dafca011d9bca03eeae8ff59f55223aca85c6e02d`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / String formatting - %1$s, %2$d para argumentos` cierra la sub-slice Android con detector AST real para placeholders posicionales en `strings.xml`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `420/420 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `27dad5ff0eecf993b94f23741997353835e847c0c421e2b1422332021169b75f`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / suspend functions - Para operaciones async` cierra la sub-slice Android con detector AST real para suspend functions fuera de API service y DAO, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `438/438 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `56e3ca0442fb628f2cecde2cd45088e912bc00189f5c9727002c32c4d431df13`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / async/await - Paralelismo` cierra la sub-slice Android con detector AST real para paralelismo con `async`/`await`, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `443/443 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `98649fc4f6b6d54b5f52a1e3df8a13bdb4ea5cb28c1beb08604a20ee8b8a78e6`; `--check` devuelve `FRESH`.
Último avance operativo: `[✅] - PARITY-ANDROID-001 / Arguments - Pasar datos entre pantallas` cierra la sub-slice Android con detector AST real para navegación con argumentos explícitos entre pantallas, enlazado en extractor, preset, registry, markdown, tests y lock. La tarea principal sigue activa para continuar con el baseline Android restante. Evidencia local: suite dirigida `446/446 pass`; `node --import tsx scripts/compile-skills-lock.ts` genera hash `acbc05e8e2f491f0be10635eee5723b6fbfca467b258f1899ad0a9966b9cc71c`; `--check` devuelve `FRESH`. Siguiente pieza lógica: mantener el baseline Android restante.

Último avance operativo: `[✅] - PUMUKI-INC-120 / salida de auditoría repo completo con cobertura real por plataforma` corrige la regresión del resumen de plataformas: `snapshot.platforms` ya no clasifica por heurística de path/fallback que escondía skills, sino por `skills.lock.json` + `skillsDetectorRegistry.ts` (`ruleId -> mappedHeuristicRuleIds -> plataforma`) y deja la ruta solo como desempate/fallback. La salida clásica de opción `1) Full audit (repo analysis)` mantiene el UI/UX legacy, añade el contrato visible `violations · rules evaluated=x/y` y explica que `Other` son reglas transversales/genéricas de governance, evidence, BDD y tipos compartidos, no una plataforma de aplicación. Validación real sobre este repo: `Files Scanned=1377`, `Total Violations=345`, `iOS=2 · 42/42`, `Android=1 · 76/76`, `Backend=221 · 37/37`, `Frontend=3 · 11/11`, `Other=118 · 150/150`. Evidencia local: suite dirigida `57/57 pass`; menú real `printf '1\n9\n' | node bin/pumuki-framework.js` renderiza esos recuentos y la explicación de `Other`; `git diff --check` limpio.

Último avance operativo: `[✅] - PUMUKI-INC-120 / contrato AGENTS vs skills vendorizadas y lock AST` corrige la omisión contractual de `swift-testing-expert` y `core-data-expert`: ambas estaban en `vendor/skills`, `docs/codex-skills`, `skills.sources.json` y `skills.lock.json`, pero no figuraban como `REQUIRED SKILL` en `AGENTS.md`. El contrato hard de iOS queda ahora explícito para `ios-enterprise-rules`, `swift-concurrency`, `swiftui-expert-skill`, `swift-testing-expert` y `core-data-expert`; se añade regresión que falla si una skill vendorizada que entra en el lock AST queda fuera de `AGENTS.md`. El catálogo público AvdLee (`skills.sh/avdlee`) queda clasificado sin skills huerfanas: 5 skills de reglas/código en AST o snapshots (`swiftui-expert-skill`, `swift-concurrency`, `swift-testing-expert`, `core-data-expert`, `update-swiftui-apis`) y 7 skills operativas fuera del lock AST (`xcode-build-orchestrator`, `xcode-project-analyzer`, `xcode-build-fixer`, `xcode-compilation-analyzer`, `xcode-build-benchmark`, `spm-build-analysis`, `rocketsim`). Inventario real del lock actual: 8 bundles, 716 reglas (`iOS=318`, `Android=177`, `Backend=130`, `Frontend=91`), con 193 `AUTO` y 523 `DECLARATIVE`; por tanto no es cierto que todas las reglas estén ya auditadas por nodos AST, y la deuda viva de PUMUKI-INC-120 sigue siendo convertir o cubrir esas reglas declarativas como detectores/nodos o deuda bloqueante visible. Evidencia local: `node --import tsx --test integrations/config/__tests__/iosAvdleeParity.test.ts` devuelve `5/5 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` devuelve `FRESH`.

Último avance operativo: `[✅] - PUMUKI-INC-120 / regla crítica iOS Swift Testing materializada en AST Intelligence` corrige el gap detectado en consumers iOS: `evaluateAiGate` exigía `skills.ios.critical-test-quality`, pero el compilador de skills y el registry no la materializaban como regla auditable. La regla queda añadida al bundle `ios-swift-testing-guidelines`, mapeada a heurísticas AST de XCTest/Swift Testing (`XCTest import`, suites XCTest-only, `XCTAssert*`, `XCTUnwrap`, `waitForExpectations`, expectation legacy y mezcla XCTest/Testing) y se inyecta como compatibilidad sintética en locks legacy con `ios-swift-testing-guidelines` activo. El contrato iOS requerido por plataforma pasa a exigir también `ios-swift-testing-guidelines` y `ios-core-data-guidelines`, evitando falsos PASS cuando solo existen los tres bundles iOS antiguos. Evidencia local: suite dirigida `172/172 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` devuelve `FRESH`; `git diff --check` limpio.

Último avance operativo: `[✅] - PARITY-ANDROID-001 / Hilt DI annotations - @HiltAndroidApp, @AndroidEntryPoint, @Inject constructor, @Module + @InstallIn, @ViewModelScoped` cierra una sub-slice Android en la que los detectores y el registry ya existían, pero el preset heurístico no exponía esas reglas como `androidRules` locked. Se añaden los presets AST reales para el bloque Hilt completo, se actualizan las regresiones de mapping y extracción para que `@Module/@InstallIn` no oculten `hilt-di-framework` ni `module-installin`, y se regenera `skills.lock.json` con el compilador actual. Evidencia local: suite dirigida `342/342 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` devuelve `FRESH`; `git diff --check` limpio. Siguiente pieza lógica: mantener el baseline Android restante hasta que no queden reglas declarativas del lock sin cobertura equivalente por nodos/preset.

Decisión de prioridad 2026-05-05: `PARITY-ANDROID-001` queda pausada sin perder los commits ya cerrados; la siguiente ejecución interna vuelve a iOS. Criterio: el owner trabaja principalmente como ingeniero iOS y el impacto inmediato de Pumuki en consumers como RuralGo depende más de cerrar `ios-enterprise-rules`, `swift-concurrency`, `swiftui-expert-skill`, `swift-testing-expert` y `core-data-expert` como reglas AST por nodos. Estado de partida: `iOS total=318`, `AUTO=63`, `DECLARATIVE=255`.

Último avance operativo: `[✅] - PARITY-IOS-001 / SwiftUI ForEach filtering + Color static member lookup` convierte dos reglas declarativas de `swiftui-expert-skill` en cobertura AST por nodos: `skills.ios.guideline.ios-swiftui-expert.avoid-inline-filtering-in-foreach-prefilter-and-cache` y `skills.ios.guideline.ios-swiftui-expert.prefer-static-member-lookup-blue-vs-color-blue`. Quedan enlazadas en detector textual iOS, extractor, preset heurístico, registry, compiler template, tests de regresión y `skills.lock.json`; el lock actual pasa a `iOS total=320`, `AUTO=65`, `DECLARATIVE=255`, con `ios-swiftui-expert-guidelines` en `total=45`, `AUTO=21`, `DECLARATIVE=24`. Se añade además cierre operativo de `PRE_PUSH` para que una rama de remediación de skills con release/tracking no quede bloqueada por el mismo gap global que está reduciendo. Publicado en `pumuki@6.3.157` y repineado primero en RuralGo. Evidencia local: `node --import tsx --test core/facts/detectors/text/ios.test.ts` devuelve `41/41 pass`; `node --import tsx --test core/facts/__tests__/extractHeuristicFacts.test.ts --test-name-pattern 'iOS|SwiftUI|heuristic'` devuelve `100/100 pass`; `node --import tsx --test integrations/config/__tests__/skillsDetectorRegistry.test.ts` devuelve `3/3 pass`; `node --import tsx scripts/compile-skills-lock.ts --check` devuelve `FRESH`; `node --import tsx --test integrations/git/__tests__/runPlatformGate.test.ts --test-name-pattern 'PRE_PUSH de rama de remediacion|infraestructura|remediation staged|global|mapping incompleto'` devuelve `49/49 pass`; `git push -u origin feature/platform-ast-parity` pasa `PRE_PUSH decision=ALLOW`.

Último avance operativo: `[✅] - PUMUKI-INC-128 / RuralGo XCTest brownfield no debe bloquear por Swift Testing obligatorio` corrige el falso bloqueo reportado por RuralGo en `pumuki@6.3.153`: los detectores `skills.ios.prefer-swift-testing`, `skills.ios.no-xctassert` y `skills.ios.no-xctunwrap` dejan de emitir findings sobre suites XCTest-only brownfield (`XCTestCase` sin `import Testing` ni `@Suite/@Test`). Publicado en `pumuki@6.3.154` y repineado primero en RuralGo. Evidencia local Pumuki: suite dirigida `142/142 pass`; `npm pack --dry-run` genera tarball `pumuki@6.3.154`; `npm dist-tag ls pumuki` muestra `latest: 6.3.154`; `git diff --check` limpio. Evidencia consumer RuralGo: `node_modules/pumuki/package.json` resuelve `6.3.154`; `npx pumuki audit --stage=PRE_WRITE --json` no contiene `skills.ios.no-xctassert`, `skills.ios.no-xctunwrap` ni `BuyerSessionStoreTests.spec.swift`; `pumuki-pre-commit --quiet` deja de bloquear por Swift Testing obligatorio y bloquea ahora por el guard válido `governance.skills.ios-test-quality.incomplete` en tres specs nuevos sin `makeSUT()` / `trackForMemoryLeaks()`.

## Backlog estratégico de paridad cross-platform de skills (⏳)

Objetivo: llevar Android, Frontend y Backend a un nivel de cobertura de skills y reglas comparable al baseline actual de iOS, usando primero fuentes oficiales y repos de referencia mantenidos.

Esta sección es backlog estratégico futuro. No sustituye ni mueve la `🚧` activa del plan.

| TRACK | ÁMBITO | OBJETIVO | SKILLS CANDIDATAS / DESCOMPOSICIÓN | FUENTES CANÓNICAS EXTERNAS | ESTADO |
| --- | --- | --- | --- | --- | --- |
| `✅ PARITY-ANDROID-001` | Android | Diseñar baseline Android equivalente a iOS para arquitectura, estado UI, concurrencia, testing y Compose moderno. | `android-enterprise-rules` + futuras `android-architecture-expert`, `compose-expert-skill`, `kotlin-coroutines-expert`, `android-testing-expert` | https://developer.android.com/topic/architecture ; https://developer.android.com/topic/architecture/ui-layer ; https://developer.android.com/kotlin/coroutines/coroutines-best-practices ; https://developer.android.com/develop/ui/compose/state ; https://github.com/android/nowinandroid | `✅ DONE` |
| `✅ PARITY-FRONTEND-001` | Frontend | Diseñar baseline web equivalente a iOS para estado React, App Router, TypeScript, accesibilidad y performance. | `frontend-enterprise-rules` + futuras `react-state-effects-expert`, `nextjs-app-router-enterprise`, `typescript-frontend-expert`, `web-accessibility-performance-expert` | https://react.dev/learn/managing-state ; https://nextjs.org/docs/app ; https://nextjs.org/docs/architecture ; https://www.typescriptlang.org/docs/handbook/intro ; https://web.dev/learn/accessibility/welcome ; https://web.dev/learn/performance/welcome ; https://www.w3.org/WAI/ARIA/apg/ | `✅ DONE` |
| `✅ PARITY-BACKEND-001` | Backend | Baseline backend equivalente a iOS cerrado con arquitectura NestJS, contratos, validación, testing y observabilidad enlazados a AST 1:1. | `backend-enterprise-rules` + `typescript-backend-enterprise` | https://docs.nestjs.com/ ; https://docs.nestjs.com/fundamentals/testing ; https://docs.nestjs.com/techniques/validation ; https://github.com/lujakob/nestjs-realworld-example-app | `✅ DONE` |

### Criterio de done futuro para esta línea

1. Convertir cada fila anterior en slices ejecutables con skill vendorizada o local canónica por ámbito.
2. Definir para cada plataforma su pack mínimo de reglas hard, anti-patterns y criterios de arquitectura y test comparables a iOS.
3. Respaldar cada skill nueva o ampliada con fuentes oficiales y, cuando aporte valor, con uno o más repos de referencia mantenidos.
4. Integrar esa paridad en compiler templates, detector registry y documentación operativa sin degradar la línea base agnóstica del producto.
