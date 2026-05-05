# Changelog

All notable changes to `pumuki` are documented here.

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [6.3.138] - 2026-05-05

### Fixed

- **Doc-only evidence hygiene:** en commits documentales, `.ai_evidence.json` trackeado queda restaurado a `HEAD` y no deja modificaciones de hook que hagan fallar integraciones `pre-commit` con `files were modified by this hook`.

## [6.3.137] - 2026-05-05

### Fixed

- **PUMUKI-INC-061 evidence/atomicity:** el guard de atomicidad ignora `.ai_evidence.json` / `.AI_EVIDENCE.json` gestionados por Pumuki al contar ficheros y scopes staged, evitando que un auto-restage de evidencia bloquee repins atómicos de consumers.

## [6.3.136] - 2026-05-05

### Fixed

- **PUMUKI-INC-059 all-severities blocking:** `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH` y `CI` bloquean cualquier finding de reglas/skills AST Intelligence, incluyendo `WARN/MEDIUM` e `INFO/LOW`.
- **Políticas no relajables:** `skills.policy`, perfiles hard-mode y `PRE_WRITE=advisory` ya no pueden rebajar el threshold efectivo por debajo de `INFO`.
- **Replay RuralGo:** validado con binario local contra RuralGo: PRE_WRITE `115/115` findings bloqueantes y PRE_COMMIT `118/118` findings bloqueantes.

## [6.3.135] - 2026-05-03

### Fixed

- **Bootstrap de pre-push por delta real:** cuando una rama no tiene upstream, el bootstrap de `PRE_PUSH` elige la base con menor delta real entre `main` y `develop`, evitando falsos positivos de atomicidad en branches nacidas de `main`.
- **Repin desbloqueable:** esta versión corrige el bloqueo que impedía publicar el repin de `Flux_training` aunque el diff efectivo del cambio fuese mínimo.

## [6.3.134] - 2026-05-03

### Fixed

- **Policy hash drift accionable:** `governanceObservationSnapshot`, `governanceNextAction` y el catálogo de remediación ya convierten la divergencia entre stages en una acción estricta y aplicable.
- **Release publicada y lista para repin:** esta versión ya está en npm y queda lista para repinear consumers activos como RuralGo con el fix real distribuido.

## [6.3.133] - 2026-05-03

### Fixed

- **Skills enforcement endurecido a bloqueo duro:** `PRE_WRITE`, `PRE_COMMIT` y `PRE_PUSH` ya no admiten bypass advisory para violaciones de skills.
- **Contrato de gate alineado de punta a punta:** `skillsEnforcement`, `evaluateAiGate`, `runPlatformGate` y el flujo CLI bloquean de forma consistente cuando falta cobertura, bundles o contrato de skills.
- **Release listo para repin:** esta versión está preparada para publicarse y repinear consumers como RuralGo sin cerrar más gaps funcionales para este fix.

## [6.3.132] - 2026-05-03

### Fixed

- **Reglas declarativas sin detector no bloquean el gate:** `unsupported_detector_rule_ids` se conserva en evidencia, pero deja de convertirse en `SKILLS_DETECTOR_MAPPING_INCOMPLETE_HIGH` cuando no hay reglas AUTO ejecutables sin detector.
- **Bloqueo solo para AUTO real:** el guard de cobertura de skills ahora bloquea exclusivamente `unsupported_auto_rule_ids`, evitando que doctrina declarativa de skills vuelva a parar consumers con `coverage_ratio=1`.
- **Regresión focalizada:** `runPlatformGate` cubre el caso en modo strict para asegurar que declarativas sin detector quedan como evidencia no bloqueante.

## [6.3.130] - 2026-05-03

### Fixed

- **Menú legacy restaurado para consumers:** la shell principal vuelve al contrato plano de 9 opciones y conserva los flujos avanzados fuera del menú por defecto.
- **Cobertura por plataforma desde skills reales:** el full audit usa `skills.lock.json` y bindings de detectores para mostrar `rules evaluated=x/y` en iOS, Android, Backend y Frontend.
- **Other deja de ser opaco:** la salida clásica explica que `Other` agrupa reglas transversales de governance, evidence, BDD y tipos compartidos.
- **Contrato AvdLee visible:** `swift-testing-expert` y `core-data-expert` quedan declaradas como skills requeridas cuando entran en el lock AST.

## [6.3.129] - 2026-04-29

### Fixed

- **Nueva slice Android de singletons cerrada:** `skills.android.no-singleton-usar-inyeccio-n-de-dependencias-hilt-dagger` pasa a detector AST real y deja de depender de normalización genérica.
- **Exclusión correcta de módulos DI:** `@Module`, `@InstallIn` y `@EntryPoint` ya no disparan el detector de singleton cuando el `object` es un módulo de inyección legítimo.
- **Cobertura de regresión y lock recompilado:** la suite Android dirigida vuelve a verde y `skills.lock.json` se regenera con el binding canónico de la nueva skill.

## [6.3.127] - 2026-04-28

### Fixed

- **Baseline enterprise fully active by default:** `sdd`, `heuristics`, `learning_context`, `analytics`, `operational_memory` and `saas_ingestion` now resolve as `strict source=default blocking=true`, aligned with `pre_write` and `mcp_enterprise`.
- **No more false default-off messaging:** disabled envelopes now say the feature was switched off explicitly by configuration, avoiding the old misleading “desactivado por defecto” copy.
- **Regression coverage:** status, lifecycle, MCP and SDD tests now assert that default-off only exists when a test or consumer explicitly sets the corresponding env var to `off`.

## [6.3.126] - 2026-04-28

### Fixed

- **Suite lifecycle determinista:** `cli.test.ts` deja de esperar `PRE_WRITE=off` cuando el contrato actual lo define como `strict` por defecto, eliminando el falso fallo de fichero en `node:test`.
- **Snapshot experimental completo:** el payload `status --json --remote-checks` valida también `mcp_enterprise=strict`, alineado con la configuración enterprise real.

## [6.3.125] - 2026-04-28

### Fixed

- **Mensajes coherentes para bloqueos `gate.blocked`:** las notificaciones y diálogos traducen `EVIDENCE_GATE_BLOCKED`, tracking canónico y atomicidad a causas humanas en vez de mostrar copy interno en inglés.
- **Tracking como causa accionable:** cuando existe `active_entries` / `tracking_source`, la remediación prioriza corregir el MD de tracking y deja de sugerir `policy reconcile && sdd validate` como solución principal.
- **Cierre de `PUMUKI-INC-118`:** el evento central de bloqueo enriquece la causa con contexto de tracking antes de construir banners, diálogos macOS y payloads de sistema.

## [6.3.123] - 2026-04-28

### Fixed

- **Detectores SOLID sin contadores arbitrarios:** `SRP`, `DIP`, `OCP` e `ISP` en iOS/Android/TypeScript dejan de depender de mínimos tipo `relatedNodes.length < N`, `typedCaseCount >= N` o cortes `slice(0, N)` y pasan a usar categorías semánticas explícitas.
- **ISP iOS/Android por familias de contrato:** los protocolos/interfaces anchos se detectan por mezcla real de `query`/`command` y uso de una sola familia por consumidor, no por número de miembros.
- **Cierre de `PUMUKI-INC-116`:** se añade regresión negativa para clases/protocolos grandes pero cohesionados y auditoría textual para impedir que los detectores estructurales vuelvan a degradarse a `N señales => bloqueo`.

## [6.3.122] - 2026-04-28

### Fixed

- **Skills estructurales sin umbrales hardcodeados:** `skills.backend.no-god-classes` / `skills.frontend.no-god-classes` dejan de depender de `GOD_CLASS_MAX_LINES` y pasan a detectar mezcla semántica de responsabilidades por nodos AST.
- **Auditoría transversal iOS/Android/backend/frontend:** las skills estructurales `God/Massive/SRP/Clean Architecture` ya no expresan límites implícitos de líneas; una regresión dedicada falla si vuelven a aparecer umbrales `> N líneas` en las skills de las cuatro plataformas.
- **Cierre de `PUMUKI-INC-115`:** Pumuki mantiene hotspots por `max_lines` solo cuando el consumer los declara explícitamente, pero las skills hard vuelven a depender de nodos AST inteligentes o reglas declarativas.

## [6.3.121] - 2026-04-28

### Fixed

- **Hotspots brownfield sin umbrales hardcodeados:** `BrownfieldHotspotGuard` deja de bloquear por tamaño implícito en carpetas `presentation`/`application`; el bloqueo por líneas solo se activa cuando el consumer declara explícitamente `max_lines` en `config/pumuki-hotspots.json`.
- **Cierre de `PUMUKI-INC-114`:** el guard mantiene bloqueo declarativo para hotspots marcados, pero SRP/god class vuelve a depender de reglas/skills AST inteligentes en vez de números internos `800/1200`.

## [6.3.120] - 2026-04-28

### Fixed

- **Watch no interactivo para auditoría machine-readable:** `pumuki watch --scope=repo --once --json` desactiva notificaciones por defecto en esa invocación de una sola pasada para terminar y emitir JSON sin depender de UI del sistema, cerrando `PUMUKI-INC-112`.
- **Bloqueos de install visibles:** cuando `pumuki install` queda bloqueado por governance, emite una notificación `gate.blocked` y añade el estado de entrega al error, cerrando la brecha de visibilidad de `PUMUKI-INC-113`.

## [6.3.119] - 2026-04-28

### Fixed

- **Contrato CLI estable para menú:** `pumuki menu --help` deja de fallar como comando desconocido y `pumuki menu` delega en el runtime de menú existente (`pumuki-framework`), cerrando `PUMUKI-INC-111` para consumers como RuralGo.

## [6.3.118] - 2026-04-28

### Fixed

- **Guard PRE_WRITE para editores/agentes vía MCP:** el catálogo enterprise expone `pre_write_guard`, una tool no mutante que ejecuta `audit --stage=PRE_WRITE --json` y devuelve `findings` accionables antes de permitir continuar una edición/restauración de ficheros.
- **Cierre operativo de `PUMUKI-INC-109`:** RuralGo ya tiene una ruta MCP explícita para bloquear antes de escribir, no sólo en commit/gate posterior.

## [6.3.117] - 2026-04-28

### Fixed

- **`pumuki audit --json` queda accionable cuando bloquea:** la salida ahora expone `findings_count`, `blocking_findings_count` y `findings`; si el gate bloquea sin findings persistidos, emite un blocker sintético `AUDIT_BLOCKED_WITHOUT_FINDINGS` para evitar JSON no accionable.
- **Auditoría previa a edición:** `pumuki audit --stage=PRE_WRITE --json` queda soportado para dar a consumers como RuralGo un contrato machine-friendly antes de continuar feature work.
- **Tracking externo prioritario:** el reset interno queda alineado con el bloqueo vivo de RuralGo `PUMUKI-INC-109`/`PUMUKI-INC-110`.

## [6.3.116] - 2026-04-25

### Fixed

- **Inventario real de dependencia local en `status` y `doctor`:** la línea publicada diferencia por fin la señal de seguridad Git (`trackedNodeModulesCount` / `trackedNodeModulesPaths`) del estado real de instalación local (`dependencyInventory`).
- **Diagnóstico consumer-facing de `pumuki`:** `status --json` y `doctor --json` exponen si existe `package.json`, lockfile, `node_modules`, declaración de `pumuki`, versión instalada y binario local.
- **Salida humana alineada:** `status` y `doctor` imprimen una línea compacta `dependency pumuki` para que el operador no confunda ausencia de `node_modules` trackeados con ausencia de instalación local.
- **Cobertura de regresión de `PUMUKI-INC-088`:** nuevas pruebas fijan el inventario de dependencia en ambas superficies lifecycle sin arrastrar el delta amplio de `develop`.

## [6.3.115] - 2026-04-24

### Fixed

- **`status` y `doctor` exponen `issues` canónicos también en evidencia `WARN`:** la línea publicada deja de reservar la lista de findings a estados bloqueados y pasa a emitir una advertencia consumible por automatización cuando governance está en atención operativa real.
- **Hotfix mínimo sobre la superficie estable de `main`:** el contrato bloqueado existente se conserva, pero ahora la evidencia `WARN` produce `Governance requires attention (...)` como issue canónico sin arrastrar snapshots adicionales de `develop`.
- **Cobertura de regresión de `INC-084` en la línea publicada:** nuevas pruebas fijan el caso `WARN` tanto en `status` como en `doctor`, manteniendo la semántica previa para estados `BLOCK`.
- **Regresión de `postinstall` resuelta en la línea publicada:** `captureRepoState` deja de importar `status.ts` y rompe el ciclo que hacía fallar `scripts/consumer-postinstall.cjs` con `ReferenceError: Cannot access 'captureRepoState' before initialization`.

## [6.3.108] - 2026-04-22

### Fixed

- **MCP enterprise visible por defecto en la línea publicada:** `mcp_enterprise` deja de nacer en `off`, así que el editor/agente puede ver `ai_gate_check`, `pre_flight_check` y `auto_execute_ai_start` sin opt-in adicional.
- **Enforcement temprano más perceptible para `PRE_WRITE`:** el catálogo enterprise visible por defecto reduce el gap entre `status`/`doctor` bloqueados y la ruta real de trabajo del agente/editor.
- **Cobertura de regresión de la baseline MCP:** nuevas pruebas fijan el catálogo del enterprise server y la proyección de baseline consumer asociada a `mcp_enterprise`.

## [6.3.107] - 2026-04-22

### Fixed

- **Semántica inequívoca para sesión SDD expirada:** una sesión vencida deja de proyectarse como `active=true` y pasa a exponerse como inactiva (`active=false`) manteniendo `valid=false` y `remainingSeconds=0`.
- **Refresh de sesión expiradas todavía permitido:** `refreshSddSession` ya no exige `active=true`; basta con conservar el `changeId` para poder renovar una sesión caducada sin reabrirla manualmente.
- **Policy SDD alineada con esa semántica:** `evaluateSddPolicy` trata la sesión como `missing` solo cuando falta `changeId`, y conserva `SDD_SESSION_INVALID` para sesiones expiradas con contexto recuperable.

## [6.3.106] - 2026-04-22

### Fixed

- **Activación advisory de SDD/PRE_WRITE fijada al runtime diagnosticado:** `sdd validate` deja de devolver `activation_command` con `pumuki@latest` cuando el namespace experimental está desactivado por defecto.
- **Session guidance reproducible en SDD:** las instrucciones de `session --refresh` y `session --open` también quedan fijadas a la versión efectiva del runtime en lugar de depender de `latest`.

## [6.3.105] - 2026-04-22

### Fixed

- **Remediaciones PRE_WRITE fijadas a la versión diagnosticada:** `sdd validate`, `auto_execute_ai_start` y la remediación por defecto dejan de recomendar `pumuki@latest` y pasan a devolver comandos con la versión efectiva del runtime (`pumuki@6.3.105` en esta línea).
- **Backport útil de `PUMUKI-INC-089` a la línea publicada:** `main` mantiene la ruta reproducible para `install`, `policy reconcile --strict --json` y la revalidación `PRE_WRITE` sin exigir al consumer adivinar la versión correcta.

## [6.3.104] - 2026-04-22

### Fixed

- **Tracking canónico de RuralGo reconocido por el parser de repo-policy:** `appendTrackingActionableContext` ya inspecciona `docs/RURALGO_SEGUIMIENTO.md`, que es la ruta canónica real del consumer.
- **Filas `| 🚧 | TASK |` tratadas como entradas activas válidas:** el diagnóstico accionable cubre el formato de tabla usado por el hub de seguimiento de RuralGo además del backlog tabular de incidencias.
- **Cobertura de regresión para el hub canónico:** nuevas pruebas fijan parsing y priorización de `docs/RURALGO_SEGUIMIENTO.md` antes de otros archivos de tracking del consumer.

## [6.3.103] - 2026-04-22

### Fixed

- **Diagnóstico accionable del tracking canónico en consumers:** `status`, `doctor` y el gate repo-policy ya incluyen `TRACKING_CANONICAL_IN_PROGRESS_INVALID` junto con referencias a entradas activas y al board canónico del repo consumidor cuando existe.
- **Separación explícita entre blocker y warning secundario:** la salida de `PRE_WRITE` conserva un `block-summary` primario y añade `warning-summary` para warnings de higiene (`EVIDENCE_PREWRITE_WORKTREE_WARN`) cuando conviven con un bloqueo duro de tracking.
- **Cobertura de regresión del hotfix:** nuevas pruebas fijan el parsing de boards tabulares `🚧 reported activo` y la impresión del resumen jerárquico con warning secundario.

## [6.3.102] - 2026-04-22

### Fixed

- **`strict` efectivo alineado con el contrato firmado:** `policyAsCode` y `stagePolicies` dejan de publicar `validation.strict` desde el entorno cuando el contrato persistido ya declara el valor por stage.
- **`policy reconcile --strict --apply` materializa el contrato completo:** el archivo `.pumuki/policy-as-code.json` pasa a persistir el mapa `strict` por stage para que `status`, `doctor` y runtime converjan sobre la misma fuente.
- **Wiring robusto de `pre-push` con hooks previos terminados en `exec`:** el bloque gestionado de Pumuki se recoloca antes del `exec` también en `pre-push`, evitando que el enforcement quede detrás de código muerto.

## [6.3.101] - 2026-04-22

### Fixed

- **`gate.blocked` sin `ReferenceError` en consumers:** `resolveBlockedRemediation` recupera su contrato con variantes (`banner`/`dialog`) y deja de romper la ruta bloqueante de `PRE_WRITE` por un `options is not defined`.
- **Cobertura de regresión del módulo de remediación:** la suite de `framework-menu-system-notifications-remediation` fija el caso de copy legacy en inglés y la compactación de banners sin truncados rotos.

## [6.3.100] - 2026-04-22

### Fixed

- **`PRE_WRITE` estricto por defecto en la línea publicada:** la resolución experimental de `pre_write` deja de nacer en `off/default` en `main` y vuelve a converger con el contrato coercitivo esperado por los consumers.
- **Regresión explícita del default efectivo:** nuevas pruebas fijan que `resolvePreWriteExperimentalFeature`, `resolvePreWriteEnforcement` y `policyValidationSnapshot` tratan `PRE_WRITE` como estricto cuando no existe override explícito.

## [6.3.99] - 2026-04-22

### Fixed

- **PRE_WRITE visible y coherente en la línea de producción:** `policyValidationSnapshot` refleja `PRE_WRITE` como estricto cuando el enforcement efectivo está activado en `strict`, evitando contradicción entre policy y runtime.
- **Arranque agentic sin éxito falso:** `auto_execute_ai_start` devuelve `success=false` cuando el gate bloquea y fuerza remediación explícita antes de continuar.
- **Contrato MCP actualizado:** la superficie HTTP del enterprise server hereda ese mismo contrato de bloqueo para `auto_execute_ai_start`.
- **Cobertura de regresión del hotfix:** nuevas regresiones fijan la proyección de `PRE_WRITE` y el comportamiento bloqueante del arranque agentic sobre la línea `main`.

## [6.3.98] - 2026-04-21

### Fixed

- **Fallback de `gate.blocked` más robusto:** las notificaciones de framework traducen causas y remediaciones legacy al español con mejor cobertura de hints en inglés, evitando copy mixto en banners y diálogos.
- **Remediación bloqueante más estable:** `framework-menu-system-notifications-remediation.ts` consolida fallback genérico por `causeCode`, normaliza prefijos legacy (`remediation:`, `fix:`, `solution:`) y degrada mensajes ingleses a copy español cuando no son presentables al usuario final.
- **Cobertura de regresión para notificaciones:** la suite de `framework-menu-system-notifications-*` cubre atomicidad legacy, fallbacks no mapeados, disable/mute y mensajes mixtos sin dejar texto en inglés visible al usuario.

## [6.3.82] - 2026-04-17

### Fixed

- **Postinstall sin MCP por defecto:** `pumuki` vuelve a ejecutar `pumuki install` en baseline y no agrega wiring MCP/IDE por defecto en postinstall. MCP explícito con `PUMUKI_POSTINSTALL_WITH_MCP=1` o `PUMUKI_POSTINSTALL_MCP_AGENT=<agent>`.
- **Errores de postinstall visibles:** si `pumuki install` falla durante `npm postinstall`, `scripts/consumer-postinstall.cjs` devuelve el código de salida real y deja trazabilidad en logs, evitando falsas instalaciones completas.
- **Smoke de superficie:** el comando separa filas de validación críticas (`core`) y diagnósticas (`diagnostic`), por lo que por defecto falla solo por regresiones funcionales y no por diagnósticos no deterministas.
- **Alcance git no trazado por defecto:** `GitService.getUnstagedFacts` y `getStagedAndUnstagedFacts` dejan fuera archivos `untracked` salvo `PUMUKI_INCLUDE_UNTRACKED_WORKTREE=1`.

## [6.3.72] - 2026-04-11

### Fixed

- **Tests `cli` (macOS):** la suite `integrations/lifecycle/__tests__/cli.test.ts` activaba **`emitGateBlockedNotification`** real en escenarios PRE_WRITE **strict** (p. ej. `OPENSPEC_MISSING`), lo que podía **bloquear** `npm test` indefinidamente al abrir notificación/diálogo del sistema. Los tests fijan **`PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS=1`** en `beforeEach` y restauran el env en `afterEach` (misma variable que el producto ya documenta para desactivar notificaciones).
- **macOS notificaciones en `gate.blocked`**: por defecto vuelve a mostrarse el **banner** de Notification Center además del modal interactivo cuando el modal está activo. Antes, si el modal (Swift/AppleScript) no llegaba a mostrarse desde un hook en un repo consumidor, podía no verse **ninguna** notificación. Opt-in al comportamiento previo (solo modal, sin banner duplicado): `PUMUKI_MACOS_GATE_BLOCKED_BANNER_DEDUPE=1`.
- **Consumer repin + MCP (IDE-agnóstico)**: el `postinstall` del paquete ejecuta **`pumuki install --with-mcp --agent=repo`** por defecto, actualizando **`.pumuki/adapter.json`** (hooks + comandos MCP stdio) sin depender de Cursor ni de ningún IDE. La plantilla `repo` usa **`json-merge`** para no pisar claves extra del consumidor. Opt-out: `PUMUKI_POSTINSTALL_SKIP_MCP=1`. Opt-in a ficheros de IDE en postinstall: `PUMUKI_POSTINSTALL_MCP_AGENT=cursor|claude|codex`.
- **macOS diálogo `gate.blocked` (Swift)**: el helper deja de usar un `NSPanel` flotante personalizado y pasa a **`NSAlert.runModal()`**, de modo que **Desactivar / Silenciar 30 min / Mantener activas** respondan de forma fiable a clics y teclado (el panel flotante podía no entregar eventos según foco de otras apps, p. ej. el IDE).

### Added

- **Smoke de superficie CLI**: `npm run smoke:pumuki-surface` (~29 invocaciones) y `smoke:pumuki-surface-installed` con `PUMUKI_SMOKE_REPO_ROOT` + `PUMUKI_SMOKE_BIN_STRATEGY=installed` para validar el bin bajo `node_modules/pumuki` del consumidor. Ver `docs/validation/README.md`.
- **Barra local sin GitHub Actions**: `npm run validation:local-merge-bar` (`typecheck` + smoke + `npm test`) como sustituto operativo cuando la org no tiene cuota útil de Actions.
- **Tarball npm**: el paquete publicado incluye también `AGENTS.md`, `CHANGELOG.md` y `docs/tracking/plan-curso-pumuki-stack-my-architecture.md` (listados en `package.json` → `files`), de modo que la misma versión en **npm** / **jsDelivr** / `node_modules` expone contrato de agentes, historial de release y el plan formativo del curso Pumuki sin depender solo de GitHub.
- **Menú consumer (`npm run framework:menu`)**: opciones `11` (solo **staged**), `12` (solo **unstaged**: `git diff` + untracked), `13` (**staged + unstaged** con política **PRE_COMMIT** sobre el working tree), `14` (**todo el repo trackeado** sin preflight). Ejecutan el motor de gate **sin preflight** consumer. Nuevo alcance de hechos `unstaged` y `GitService.getUnstagedFacts`.
- **Vista “classic” en consola**: segundo panel tras el resumen consumer con severidades coloreadas (enterprise + legacy), hasta 45 hallazgos ordenados, filas **platform** si existen en la evidencia, y nota sobre heurística `Other`. Variable `PUMUKI_MENU_VINTAGE_REPORT=0` para desactivar.
- **Transparencia PRE_PUSH**: tras opciones `2` y `4` con outcome **PASS/WARN**, mensaje sobre posible **no escritura** en disco de `.ai_evidence.json` trackeado y variable `PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE`.
- **Etiquetas consumer** para opciones `1–4` y hints de evidencia/preflight alineados con alcance real (preflight vs motor, riesgo de skip en disco).

### Changed

- **`runConsumerMenuMatrix` / baseline / summary**: la matriz consumer incluye también las opciones `11–14` (misma semántica que el menú: staged, unstaged, working tree **PRE_COMMIT**, repo completo, sin preflight), junto a `1–4` y `9`. Se exporta `MATRIX_MENU_OPTION_IDS` como lista canónica de ids.
- **OpenSpec / SDD**: detección y ejecución del CLI OpenSpec solo usan `node_modules/.bin/openspec` **del repositorio** (ya no se resuelve un `openspec` genérico del `PATH`). Instala `@fission-ai/openspec` en el consumidor para SDD estricto; evita resultados distintos entre máquinas con CLI global y CI limpio. Documentado en `docs/product/USAGE.md` (flujo SDD obligatorio, integración OpenSpec y troubleshooting).

### Security

- Dependencias transitivas al día vía `npm audit fix` (p. ej. `ajv`, `brace-expansion`, `flatted`, `picomatch`).

## [6.3.71] - 2026-04-06

### Added

- **`operational_hints` en `.ai_evidence.json` (v2.1)**: `requires_second_pass`, `second_pass_reason`, `human_summary_lines` (resumen corto) y `rule_execution_breakdown` (evaluadas / bloqueo / warn / info / fuera de alcance). Tras PRE_COMMIT con índice solo documentación y evidencia trackeada, si no se auto-stagea el fichero, se reescribe la evidencia con `requires_second_pass=true` y motivo estable.
- **`PUMUKI_GATE_SCOPE_PATH_PREFIXES`**: lista separada por comas o `;` con prefijos de ruta; el gate filtra hechos de archivo del **primer** alcance (staged/range/worktree) para reducir ruido en monorepos (los heurísticos sin `filePath` y dependencias siguen pasando).
- **`pumuki doctor --parity`**: emite `parity_profile` (versión instalada + bundle/hash/signature de policy PRE_COMMIT). Si existe `.pumuki/ci-parity-expected.json` con `pumuki_package_version` / `pre_commit_policy_hash` / `pre_commit_policy_bundle`, añade `parity_comparison`; discrepancias hacen fallar el comando (exit 1) además del veredicto doctor habitual.

### Changed

- **Remediaciones compartidas**: `integrations/gate/remediationCatalog.ts` unifica textos de remediación usados por hooks y por `ai_gate_check` (MCP) para los mismos códigos de violación.
- **PRE_COMMIT + `.ai_evidence.json` trackeado** (PUMUKI-INC-069): si el índice solo contiene documentación (`*.md` / `*.mdx`, aparte de la evidencia), el hook no hace `git add` automático tras un gate no bloqueante; opt-in: `PUMUKI_PRE_COMMIT_ALWAYS_RESTAGE_TRACKED_EVIDENCE=1`.

## [6.3.70] - 2026-04-06

### Fixed

- **PRE_PUSH + `.ai_evidence.json` trackeado**: si el fichero está en el índice de git y el outcome del gate **no** es `BLOCK` (`PASS`/`WARN`), Pumuki **ya no reescribe** `.ai_evidence.json` en disco. Evita que integraciones que ejecutan **pre-commit** dentro de **pre-push** fallen con *files were modified by this hook* pese a `decision=ALLOW`. La telemetría del gate sigue generándose; el snapshot versionado sigue siendo el último producido en **PRE_COMMIT** hasta el siguiente commit. Opt-in al comportamiento anterior: `PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE=1`.
- **macOS `gate.blocked` con modal activo**: no se envía el banner `osascript` duplicado cuando ya se muestra el diálogo interactivo (menos confusión con el Centro de notificaciones). Panel Swift: `KeyableFloatingPanel` + `becomesKeyOnlyIfNeeded = false` para que los botones **Desactivar / Silenciar 30 min / Mantener activas** reciban clics de forma fiable.

## [6.3.69] - 2026-04-05

### Changed

- **`gate.blocked` (macOS)**: además del banner/`osascript`, el mismo payload se escribe en **stderr** por defecto para que un bloqueo PRE_COMMIT/PRE_PUSH/CI sea visible aunque macOS no muestre la notificación (Focus, permisos del terminal, etc.). Silenciar solo ese duplicado: `PUMUKI_DISABLE_GATE_BLOCKED_STDERR_MIRROR=1`. Sigue aplicando `PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` para cortar cualquier vía stderr.
- **Modal de bloqueo (macOS)**: con notificaciones activas, el diálogo flotante/AppleScript con **Desactivar / Silenciar 30 min / Mantener activas** vuelve a estar **habilitado por defecto** (antes `blockedDialogEnabled` caía en `false` si no venía en JSON). Para desactivar solo el modal sin cortar banners: `"blockedDialogEnabled": false` en `.pumuki/system-notifications.json` o `PUMUKI_MACOS_BLOCKED_DIALOG=0`. Los clics se normalizan mejor (mayúsculas/espacios y salida ruidosa de `osascript`) para que mute/disable persistan en disco.
- **Hooks Git (`runPlatformGate`)**: se fusionan violaciones de política de repo desde `evaluateAiGate` que antes solo impactaban MCP/menú: **`GITFLOW_PROTECTED_BRANCH`** y **higiene de worktree** (`EVIDENCE_PREWRITE_WORKTREE_*`, mismos umbrales `PUMUKI_PREWRITE_WORKTREE_*`) ahora aplican también en **PRE_COMMIT**, **PRE_PUSH** y **CI** cuando la evidencia es válida (git-flow y pending_changes siguen activos aunque falte evidencia vía `evaluateAiGate`).

### Migration

- Si tenías `.pumuki/system-notifications.json` con `"enabled": true` y **omitías** `blockedDialogEnabled` asumiendo que el modal estaba apagado, ahora el modal queda **encendido**. Fija explícitamente `"blockedDialogEnabled": false` para recuperar el comportamiento anterior.

## [6.3.68] - 2026-04-06

### Added

- **PRE_WRITE en la cadena Git (sin IDE)**: los hooks gestionados **`pre-commit`** y **`pre-push`** ejecutan **`pumuki-pre-write`** antes del binario principal. Así el stage **PRE_WRITE** forma parte del flujo real de cualquier repo con Git. Desactivar solo esa parte: `PUMUKI_SKIP_CHAINED_PRE_WRITE=1`.
- **`.pumuki/adapter.json` por defecto**: en **`pumuki install`**, si el fichero no existe, se genera con plantilla **`repo`** (comandos de hooks + MCP enterprise/evidence) para que los procesos stdio y la documentación del repo no dependan de Cursor/Codex.

## [6.3.67] - 2026-04-06

### Fixed

- **Línea base agnóstica al IDE**: el `postinstall` de npm **no** debe acoplar Pumuki a Cursor, Codex ni ningún IDE. Se revierte el experimento **6.3.66** que ejecutaba `pumuki install --with-mcp --agent=cursor` por defecto. El postinstall vuelve a ser solo **`pumuki install`** (hooks Git, estado de lifecycle, evidencia cuando aplica; OpenSpec sigue **omitido** por defecto en ese camino, como en **6.3.63+**).
- **Adaptadores opcionales**: MCP, `.cursor/`, `.claude/`, etc. siguen disponibles con **`pumuki install --with-mcp --agent=<nombre>`** o **`pumuki bootstrap --enterprise`**, explícitos por repo/equipo.

### Changed

- Plantilla **Cursor** del adaptador: se mantienen **fusión JSON** en `.cursor/mcp.json` y **`.pumuki/adapter.json`** cuando el usuario elige `--agent=cursor` (no en postinstall).

## [6.3.65] - 2026-04-06

### Fixed

- **Integración con pre-commit.com**: si el hook `pre-commit` termina en `exec … pre_commit`, el bloque gestionado por Pumuki se insertaba **después** y nunca se ejecutaba. Ahora se detecta esa plantilla y el bloque Pumuki se coloca **justo después del shebang**, antes del `exec`. Tras actualizar, ejecutar `pumuki install` en el consumer para reescribir `.git/hooks/pre-commit`.

## [6.3.64] - 2026-04-05

### Fixed

- **System notifications fuera de macOS**: el gate ya no bloquea por plataforma; en Linux/Windows/WSL (y similares) el payload se escribe en **stderr** por defecto (`reason: stderr-fallback`). Silenciar con `PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` (vuelve `unsupported-platform` sin escribir).
- **macOS**: si el banner falla (`command-failed`), se aplica el mismo fallback a stderr salvo que el fallback esté desactivado. `PUMUKI_NOTIFICATION_STDERR_MIRROR=1` duplica el texto en stderr además del banner nativo.

## [6.3.63] - 2026-04-05

### Added

- **`npm` postinstall (consumer)**: tras `npm install` en un repo Git, Pumuki ejecuta `pumuki install` de forma automática (`INIT_CWD`), sin OpenSpec bootstrap por defecto en ese camino. Desactivar con `PUMUKI_SKIP_POSTINSTALL=1` o en CI (`CI=true`). No sustituye la configuración manual de MCP en el IDE.
- **Best-effort install**: si `doctor` bloquea el baseline pero `PUMUKI_AUTO_POSTINSTALL=1` (postinstall), se cablean igualmente hooks + estado + evidencia bootstrap con aviso de modo degradado.

## [6.3.62] - 2026-04-05

### Fixed

- macOS system notifications: anti-spam **blocked** dialog is now **opt-in** (`PUMUKI_MACOS_BLOCKED_DIALOG=1` or `"blockedDialogEnabled": true` in `.pumuki/system-notifications.json`); default path stays banner-only. Swift panel wiring hardened (focus, window lifecycle).

### Changed

- CLI / lifecycle test fixtures aligned with `PRE_WRITE` in policy payloads (`source` fields, doctor/status JSON shape).
- Gate / git hook / framework-menu tests refreshed (stage policies, hook summaries, consumer menu layout group titles).
- File-size guardrail overrides updated for current `cli` / gate sources; install smoke fixture version aligned with package semver.

## [6.3.61] - 2026-03-31

### Fixed

- `PRE_WRITE` and `PRE_COMMIT` now block brownfield hotspots before structural debt accumulates.
  - `BrownfieldHotspotGuard` enforces file-size thresholds plus required refactor plans and ADRs for flagged hotspots.
  - Gate policy/profile wiring now treats `PRE_WRITE` as a first-class stage across skills and policy packs.

### Changed

- iOS enforcement now vendors `swift-testing-expert` and `core-data-expert` and adds a versioned SwiftUI modernization snapshot.
  - New auditable rules detect legacy `foregroundColor`, `cornerRadius`, `tabItem`, and `ScrollView(..., showsIndicators: false)` usage.
  - Skills compilation, evidence mapping, and iOS rule-pack docs stay aligned with the new enforcement bundle.

## [6.3.57] - 2026-03-11

### Changed

- Semantic findings now carry richer AST-driven payloads across the gate/evidence pipeline.
  - TypeScript, iOS and Android heuristic extraction adds structured context such as semantic node coverage and platform-specific signal enrichment.
  - Evidence/gate evaluation now preserves that richer traceability for downstream consumers and diagnostics.
- The vendored enterprise skill chain is now canonical in the published package.
  - `vendor/skills/*` and `docs/codex-skills/*-enterprise-rules.md` stay aligned with the runtime package manifest and release tooling.
  - Package validation and sync scripts now follow the canonical `*-enterprise-rules` naming instead of legacy `windsurf-rules-*` paths.

## [6.3.56] - 2026-03-11

### Fixed

- `PRE_COMMIT` no longer reintroduces `.ai_evidence.json` into the index when that file is tracked in the repo but was not staged before the gate started.
  - Successful commit flows now restore tracked evidence deterministically instead of contaminating unrelated commits with refreshed evidence.

## [6.3.55] - 2026-03-06

### Fixed

- `status` and `doctor` now detect when the consumer repository path contains the system `PATH` delimiter and `npx/npm exec` can therefore fail to resolve `pumuki`.
  - They now expose:
    - `version.pathExecutionHazard`
    - `version.pathExecutionWarning`
    - `version.pathExecutionWorkaroundCommand`
- `version.alignmentCommand` now switches automatically to a safe local invocation when the repo path makes `PATH`-based execution unsafe.
  - On POSIX consumers such as `SAAS:APP_SUPERMERCADOS`, remediation now points to `node ./node_modules/pumuki/bin/pumuki.js install` instead of an `npx --package ... pumuki install` command that can fail with `sh: pumuki: command not found`.
- Human-readable `pumuki status` and `pumuki doctor` now print both:
  - `execution warning`
  - `execution workaround`
  when this path hazard is detected.

## [6.3.54] - 2026-03-06

### Fixed

- The published npm package now includes `docs/codex-skills/*.md`.
  - Consumers can compile the core skills lock from `skills.sources.json` inside `node_modules/pumuki` instead of silently losing `backend-guidelines`, `frontend-guidelines`, `ios-guidelines`, `swift-concurrency`, `swiftui-expert-skill`, and `android-guidelines`.
- Package manifest validation now treats the vendored codex skill markdown files as required runtime package assets.
  - This prevents future releases from shipping a tarball where skills coverage gates fail in consumers because the package is missing its own core skill sources.

## [6.3.53] - 2026-03-06

### Fixed

- `pumuki watch` now respects the requested `repoRoot` when collecting facts and running the gate in cross-repo mode.
  - Prevents false findings and notifications coming from the current working directory instead of the target checkout.
- `PRE_WRITE` worktree hygiene now uses deduplicated pending file count when repo state provides it.
  - Avoids overcounting partially staged files such as `MM foo.ts`.
- Custom skills bundle hashes now include `ast_node_ids`.
  - Policy/evidence drift detection now changes when AST coverage of `AUTO` rules changes.
- `auto_execute_ai_start` now treats `EVIDENCE_CHAIN_INVALID` as an actionable evidence failure.
  - The next action now tells the user to regenerate or refresh evidence instead of falling back to a generic message.

## [6.3.52] - 2026-03-06

### Fixed

- `pumuki status` and `pumuki doctor` now expose version semantics explicitly instead of mixing runtime, consumer-installed and lifecycle-installed versions under an ambiguous single label.
  - Both commands now include a structured `version` block with:
    - `effective`
    - `runtime`
    - `consumerInstalled`
    - `lifecycleInstalled`
    - `source`
    - `driftFromRuntime`
    - `driftFromLifecycleInstalled`
    - `driftWarning`
- Human-readable output now reports:
  - effective version,
  - runtime version,
  - consumer installed version,
  - lifecycle installed version,
  - and an explicit drift warning when those values diverge.

## [6.3.51] - 2026-03-06

### Fixed

- `PRE_COMMIT` no longer leaves `.ai_evidence.json` dirty after a successful commit when that file was already tracked.
  - The hook now re-stages the refreshed evidence only when the file is already part of the index.
- `PRE_PUSH` now respects the exact hook refspec range (`remoteOid..localOid`) when publishing a specific commit instead of always evaluating `upstream..HEAD`.
- `PRE_PUSH` now suspends SDD session enforcement for historical publishes that target an exact commit different from current `HEAD`.
  - Prevents false `SDD_SESSION_*` / `SDD_CHANGE_*` blocks when replaying already closed commits.
- `pumuki sdd evidence` keeps the repo-bound safety check for `--test-output`, but now suggests an immediate valid ephemeral path inside the repo, such as `.pumuki/runtime/<file>.log`.

## [6.3.50] - 2026-03-05

### Improved

- `GIT_ATOMICITY_TOO_MANY_SCOPES` now includes actionable scope/file breakdown in the blocking payload.
  - Adds `scope_files=...` with per-scope count and sample files.
  - Improves deterministic split guidance in remediation (`Sugerencia split`).
- Gate block summary `next_action` for this code now points explicitly to the `scope_files` breakdown before splitting staging.

## [6.3.49] - 2026-03-05

### Fixed

- `pumuki watch --json` now aligns `lastTick.changed` with real file delta of the evaluated scope.
  - For `scope=staged`, when no staged files are present (`changedFiles=[]`, `evaluatedFiles=[]`), `changed=false`.
  - Avoids ambiguous interpretation where `changed=true` previously represented tick execution instead of actual scoped changes.

## [6.3.48] - 2026-03-05

### Fixed

- `pumuki watch` now enforces manifest integrity guard during gate evaluation:
  - snapshots/restores `package.json`, `package-lock.json`, `pnpm-lock.yaml`, and `yarn.lock`,
  - blocks the tick with `MANIFEST_MUTATION_DETECTED` when unexpected mutation is detected and reverted.
- Hook-stage manifest guard (`PRE_COMMIT` / `PRE_PUSH`) now also covers `pnpm-lock.yaml` and `yarn.lock` in addition to npm manifests.
- Prevents silent dependency drift in consumer repos during validation flows when no explicit upgrade command is requested.

## [6.3.47] - 2026-03-05

### Fixed

- Hooks/gates now enforce manifest integrity in `PRE_COMMIT` and `PRE_PUSH`:
  - snapshot + automatic restore for `package.json` and `package-lock.json`,
  - explicit block code `MANIFEST_MUTATION_DETECTED` when unexpected mutation is detected.
- Prevents unintended consumer manifest drift during normal hook/gate execution unless upgrade is explicitly requested by the developer.

## [6.3.46] - 2026-03-05

### Added

- `pumuki watch --json` ahora expone metadata de versión efectiva/runtime:
  - `version.effective`
  - `version.runtime`
  - `version.consumerInstalled`
  - `version.source`
  - `version.driftFromRuntime`
  - `version.driftWarning` (cuando hay desalineación).

### Fixed

- Hooks (`pre-commit`/`pre-push`) ahora auto-reconcilian policy (`--strict --apply`) y reintentan una vez cuando el bloqueo corresponde a códigos de skills coverage:
  - `SKILLS_PLATFORM_COVERAGE_INCOMPLETE_HIGH`
  - `SKILLS_SCOPE_COMPLIANCE_INCOMPLETE_HIGH`
  - `EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE`
  - `EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING`
  - `EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE`
- Se reduce fricción de bootstrap manual repetitivo entre iteraciones al unificar comportamiento de hook con `watch`.

## [6.3.45] - 2026-03-05

### Added

- `pumuki sdd sync-docs` sincroniza por defecto los tres documentos canónicos del consumer cuando existen:
  - `docs/strategy/ruralgo-tracking-hub.md`
  - `docs/technical/08-validation/refactor/operational-summary.md`
  - `docs/validation/refactor/last-run.json`
- `pumuki sdd auto-sync` incluye por defecto artefactos OpenSpec por cambio:
  - `openspec/changes/<change>/tasks.md`
  - `openspec/changes/<change>/design.md`
  - `openspec/changes/<change>/retrospective.md`

### Changed

- MCP tools (`ai_gate_check`, `pre_flight_check`, `auto_execute_ai_start`) ahora incorporan `learning_context` automáticamente desde `openspec/changes/<change>/learning.json` cuando existe cambio activo.

### Fixed

- `sync-docs` crea secciones managed faltantes de forma idempotente y evita conflictos falsos al inicializar documentación canónica nueva.

## [6.3.43] - 2026-03-05

### Changed

- `pumuki sdd evidence` now emits TDD/BDD-compatible contract by default:
  - `version` normalized to `"1"`,
  - includes required `slices[]` payload (`red/green/refactor`) for gate validation.
- Legacy compatibility is preserved in the scaffold payload:
  - keeps `scenario_id`, `test_run`, and `ai_evidence` fields used by existing consumers.

### Fixed

- Resolved consumer regression where scaffolded evidence was rejected as invalid (`TDD_BDD_EVIDENCE_INVALID`):
  - previous payload used `version: "1.0"` without `slices[]`.
- `sdd state-sync` now accepts source evidence versions `1` and `1.0` for backward compatibility during rollout.

## [6.3.42] - 2026-03-05

### Changed

- Blocked modal (macOS Swift helper) now prioritizes readable vertical layout:
  - narrower width range (`360..620`) to avoid oversized horizontal dialogs,
  - dynamic height growth from content fitting size,
  - compact typography for cause/remediation blocks.
- Blocked remediation text is now more actionable by default:
  - richer guidance for `EVIDENCE_*`, `PRE_PUSH_UPSTREAM_MISSING`, `SDD_SESSION_*`,
  - remediation truncation budget increased to preserve useful resolution steps.

### Fixed

- Improved multiline wrapping behavior in floating blocked dialog:
  - explicit word wrapping and multiline cell configuration for title/cause/remediation,
  - avoids aggressive truncation in long real-world messages.
- Bottom-right pinning remains stable after dynamic relayout on real displays.

## [6.3.41] - 2026-03-05

### Changed

- macOS blocked notifications now include project context in subtitle:
  - format: `<project> · <stage> · <cause-summary>`,
  - improves differentiation when multiple repos are active.
- Blocked dialog is now enabled by default on macOS for `gate.blocked`:
  - explicit override remains available via `PUMUKI_MACOS_BLOCKED_DIALOG=0|1`,
  - existing anti-spam controls (`mute/disable`) are preserved.

### Fixed

- Notification config parser and persistence now carry `blockedDialogEnabled` deterministically.
- Added regression coverage for:
  - project label rendering in blocked subtitle,
  - default blocked-dialog activation without explicit env flag.

## [6.3.40] - 2026-03-05

### Added

- AST Intelligence dual validation PoC (`#616`) with compatibility-first rollout:
  - new dual mode runtime: `PUMUKI_AST_INTELLIGENCE_DUAL_MODE=off|shadow|strict`,
  - new guard findings:
    - `governance.ast-intelligence.dual-validation.shadow` (`INFO`, non-blocking),
    - `governance.ast-intelligence.dual-validation.mismatch` (`ERROR`, blocking in `strict`),
  - deterministic runtime summary in gate logs:
    - mapped rules, divergences, `false_positives`, `false_negatives`, `latency_ms`, languages.
- RFC + roadmap for AST Intelligence by nodes:
  - `docs/validation/ast-intelligence-validation-roadmap.md`,
  - includes architecture target, 30/60/90 plan, rollout and rollback contract.
- Backlog watcher/reconcile JSON now includes `next_commands[].probe_kind`:
  - `json_contract` for dry-run probe validation.
  - `state_recheck` for apply probe validation.

### Fixed

- Stage gates now block deterministically when code changes are detected but rules coverage has no active rules:
  - new finding `governance.rules.active-rule-coverage.empty`,
  - code `ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH`,
  - prevents false-green `PASS/ALLOW` with `active_rule_ids=[]` on code surfaces.
- iOS XCTest quality enforcement for enterprise gates (`PRE_COMMIT/PRE_PUSH/CI`):
  - new finding `governance.skills.ios-test-quality.incomplete`,
  - code `IOS_TEST_QUALITY_PATTERN_MISSING_HIGH`,
  - blocks when XCTest sources in `apps/ios/**/Tests/**.swift` miss `makeSUT()` and/or `trackForMemoryLeaks()`.
- Fixed findings trace consistency in stage gates:
  - guard-driven blocking conditions are now always propagated to `effectiveFindings`,
  - avoiding opaque `BLOCK` outcomes without explicit finding payload.
- PRE_PUSH scope false positives caused by upstream misalignment now fail fast with deterministic signal:
  - upstream drift is detected earlier (`PRE_PUSH_UPSTREAM_MISALIGNED`) before scope coverage evaluation.
- Local smoke for consumer install now falls back deterministically when `npx --no-install` crashes with runtime import errors (`MODULE_NOT_FOUND`).
- `ai_gate_check` consistency hints now cover legacy `EVIDENCE_*` codes (including `EVIDENCE_INTEGRITY_MISSING`) to reduce hook-vs-MCP diagnosis drift.

## [6.3.39] - 2026-03-04

### Added

- Cross-platform critical skills enforcement in platform gate evaluation:
  - new blocking finding `governance.skills.cross-platform-critical.incomplete` when a detected platform has no critical (`CRITICAL/ERROR`) skills rules active/evaluated.

### Changed

- Adapter-generated hook/CI commands now resolve robustly through:
  - `npx --yes --package pumuki@latest ...`
  - eliminating fragile dependency on local `./node_modules/.bin` availability in consumer repos.
- Git atomicity enforcement is now enabled by default:
  - base guard is active out-of-the-box for `PRE_COMMIT/PRE_PUSH/CI`,
  - existing env/config overrides are preserved for controlled opt-out or threshold tuning.
- Lifecycle hook diagnostics now expose effective hooks path resolution:
  - `status`/`doctor` include `hooksDirectory` and `hooksDirectoryResolution`,
  - console output now prints the effective hook path used for evaluation.

### Fixed

- Commit-range facts resolution no longer crashes or degrades ambiguously when refs are not resolvable (for example repos without `HEAD` yet):
  - guarded `rev-parse --verify` + safe fallback behavior in git-range facts collection.
- `core.hooksPath` hardening for versioned hooks:
  - hook path resolution now falls back to local `.git/config` (`core.hooksPath`) when `git rev-parse --git-path hooks` is unavailable,
  - non-regression coverage added for both versioned hooks and fallback resolution.
- Stage-gates non-regression suite stabilization:
  - updated lifecycle ingestion and preflight fixtures to the current evidence v2.1 contract (`evidence_chain` and `evidence.source`),
  - aligned architecture guardrail overrides for the current orchestrator module size/import profile (`integrations/lifecycle/cli.ts`).

## [6.3.38] - 2026-03-04

### Added

- Optional macOS blocked dialog flow for gate failures (`PUMUKI_MACOS_BLOCKED_DIALOG=1`):
  - full cause + remediation detail in modal dialog,
  - anti-spam user controls in dialog:
    - `Mantener activas`
    - `Silenciar 30 min`
    - `Desactivar`
  - auto-timeout (`15s`) to avoid hanging local execution when no user interaction happens.

### Changed

- Blocked macOS notification UX is now short and human-readable by default:
  - title in Spanish (`🔴 Pumuki bloqueado`),
  - compact subtitle with stage + summarized cause,
  - message starts with `Solución: ...` so remediation is visible in banner-limited space.
- Added mute-aware notification delivery:
  - support for `muteUntil` in `.pumuki/system-notifications.json`,
  - suppressed delivery while mute window is active (`reason=muted`).

### Fixed

- Stabilized `stageRunners` test baseline against current core-skills contract:
  - test harness now keeps core skills enabled (`PUMUKI_DISABLE_CORE_SKILLS=0`) to avoid false gate blocks from scope/platform compliance rules,
  - restored passing regression set for affected suite.

## [6.3.24] - 2026-02-27

### Added

- New deterministic local loop runner workflow in lifecycle CLI:
  - `pumuki loop run --objective=<text> [--max-attempts=<n>]`
  - `pumuki loop status --session=<id>`
  - `pumuki loop stop --session=<id>`
  - `pumuki loop resume --session=<id>`
  - `pumuki loop list`
  - `pumuki loop export --session=<id> --output-json=<path>`
- Session contract and local deterministic store for loop execution:
  - `integrations/lifecycle/loopSessionContract.ts`
  - `integrations/lifecycle/loopSessionStore.ts`
- Per-attempt loop evidence snapshots:
  - `.pumuki/loop-sessions/<session-id>.attempt-<n>.json`

### Changed

- `pumuki loop run` now executes one strict fail-fast gate attempt (`workingTree` scope) and persists outcome/evidence atomically.
- Documentation updated with loop commands and runtime semantics:
  - `README.md`
  - `docs/product/USAGE.md`

### Fixed

- Stabilized waiver test against clock drift by using a future deterministic expiry in:
  - `integrations/git/__tests__/tddBddEnforcement.test.ts`
- Aligned `VERSION` file with active package line (`v6.3.24`).

## [6.3.23] - 2026-02-27

### Changed

- Restored README hero behavior to the prior full-width classic brand rendering:
  - `<img src="assets/logo.png" alt="Pumuki" width="100%" />`
- Keeps a deterministic, simple image path for npm and GitHub renderers.

## [6.3.22] - 2026-02-27

### Changed

- Final README hero render fix for npm/GitHub consistency:
  - switched hero asset reference from SVG to raster banner PNG:
    - `![Pumuki](assets/logo_banner.png)`
  - added generated `assets/logo_banner.png` (2400x720) to avoid npm SVG rendering differences.

## [6.3.21] - 2026-02-27

### Changed

- Forced root `README.md` hero banner to explicit full-width rendering using HTML:
  - `<img src=\"assets/logo_banner.svg\" alt=\"Pumuki\" width=\"100%\" />`

## [6.3.20] - 2026-02-27

### Changed

- Restored root `README.md` hero image to full-width banner rendering (`assets/logo_banner.svg`).

## [6.3.19] - 2026-02-27

### Changed

- Restored root `README.md` hero image to classic `assets/logo.png` rendering.

### Added

- Added a friendly GitHub star reminder section at the end of root `README.md`.

## [6.3.18] - 2026-02-27

### Added

- Added production operations policy document at `docs/operations/production-operations-policy.md` with:
  - SaaS operation scope
  - minimum SLO/SLA targets
  - incident severity and response expectations
  - alerting baseline and go-live checklist
- Added dedicated README walkthrough document at `docs/operations/framework-menu-consumer-walkthrough.md` for menu Option 1 captures.
- Added explicit collaboration section in root `README.md` with contributor expectations and minimum validation commands.

### Changed

- Root `README.md` was rebuilt with enterprise-first structure:
  - audience split (consumer, maintainers, platform owners)
  - 5-minute consumer quick start moved to top
  - framework-only commands separated from consumer commands
  - troubleshooting expanded with validated failure modes and required flags
  - documentation index expanded and normalized
- Updated docs index and usage/install guides to include operations policy and walkthrough references:
  - `docs/README.md`
  - `docs/product/USAGE.md`
  - `docs/product/INSTALLATION.md`
- Validation command documentation now reflects real prerequisites and execution semantics:
  - required flags for `validation:*` scripts (`--repo`, `--repo-path`, `--skip-workflow-lint`)
  - non-zero diagnostic verdict behavior documented (`BLOCKED`, `PENDING`, `MISSING_INPUTS`).

### Fixed

- Corrected legacy parity report command syntax in docs to required `--legacy=<path>` and `--enterprise=<path>` argument format.
- Corrected custom skills import documentation to use real absolute `SKILL.md` source paths instead of placeholder pseudo-paths.

## [6.3.17] - 2026-02-20

### Added

- Introduced deterministic `repo_state.lifecycle.hard_mode` capture in evidence generation (`.pumuki/hard-mode.json` persisted and normalized into `.ai_evidence.json`).
- Added lifecycle adapter scaffolding command surface:
  - `pumuki adapter install --agent=<codex|claude|cursor|windsurf|opencode> [--dry-run]`
  - `npm run adapter:install -- --agent=<name>`
- Added framework menu hard-mode configuration action for enterprise operation (`Configure hard mode enforcement (enterprise)`).

### Changed

- Unified AI Gate contract now carries resolved policy trace for all stages, including `PRE_WRITE` mapped deterministically to `PRE_COMMIT` policy resolution.
- Enterprise MCP tool `ai_gate_check` now returns resolved policy metadata (`policy.stage`, `policy.resolved_stage`, `policy.trace`) in the tool result envelope.
- Refreshed `README.md` with enterprise-first onboarding structure (quickstart, hard mode, PRE_WRITE chain contract, lifecycle/adapters, MCP map).

### Fixed

- Closed PRE_WRITE/MCP policy drift by propagating the same hard-mode persisted policy trace used in `PRE_COMMIT/PRE_PUSH/CI`.

## [6.3.16] - 2026-02-20

### Fixed

- MCP evidence `/status` now guarantees `evidence.exists` as a strict boolean across `missing`, `invalid`, and `valid` evidence states (no `null` ambiguity), while preserving `evidence.present` as compatibility alias.
- Evidence runtime consolidation now deduplicates base/skills overlaps with deterministic semantic collision keys (`stage+platform+file+anchor+family`), preserving suppressed traceability metadata (`replacedByRuleId`, `replacementRuleId`, `platform`, `reason`).
- Runtime dependency `ts-morph` minimum version is now `>=27.0.2`, removing the high-severity production chain `ts-morph -> @ts-morph/common -> minimatch<10.2.1`; `npm audit --omit=dev` is now clean (`0` vulnerabilities).
- Fixed strict TypeScript typing in `integrations/evidence/buildEvidence.ts` (`normalizeAnchorLine`) to avoid union narrowing errors during `tsc --noEmit`.

### Changed

- Consolidated official documentation index and references to the active enterprise set only.
- Updated governance references from `CLAUDE.md` to `PUMUKI.md` across active docs.

### Removed

- Deprecated documentation artifacts and duplicated image mirrors under `docs/images/*`.
- Legacy docs-hygiene command path from package scripts and framework menu maintenance actions.
- Docs-hygiene-only guardrail tests and helper scripts that were not part of runtime enforcement.

## [6.3.15] - 2026-02-19

### Fixed

- Removed unused runtime dependency `glob` from `dependencies` to eliminate the vulnerable consumer chain `pumuki -> glob -> minimatch` without changing the Node.js support baseline (`>=18`).
- Regenerated lockfile after dependency cleanup to keep published manifest deterministic.

## [6.3.14] - 2026-02-18

### Added

- New lifecycle command `pumuki remove` to perform enterprise cleanup and dependency removal in one step:
  - removes managed hooks and lifecycle local state,
  - purges untracked evidence artifacts,
  - uninstalls `pumuki` from the consumer `package.json`,
  - package canonical name migrated from `pumuki-ast-hooks` to `pumuki` for enterprise UX (`npm install pumuki`),
  - prunes orphan `node_modules/.package-lock.json` residue when `node_modules` has no other content.
- OpenSpec+SDD enterprise baseline:
  - new SDD integration module at `integrations/sdd/*` (policy, session store, OpenSpec CLI adapter),
  - new commands `pumuki sdd status`, `pumuki sdd session`, `pumuki sdd validate`,
  - new pre-write gate command `pumuki-pre-write` / `pumuki:sdd:pre-write`,
  - SDD enforcement integrated across `PRE_WRITE`, `PRE_COMMIT`, `PRE_PUSH`, and `CI`,
  - emergency bypass support `PUMUKI_SDD_BYPASS=1` with explicit evidence traceability.
- New enterprise MCP server `pumuki-mcp-enterprise`:
  - resources: `evidence://status`, `gitflow://state`, `context://active`, `sdd://status`, `sdd://active-change`,
  - tools: `ai_gate_check`, `check_sdd_status`, `validate_and_fix`, `sync_branches`, `cleanup_stale_branches`,
  - fail-safe response envelope for `/tool` executions with deterministic JSON.

### Changed

- Stage-gates test execution now uses glob-based test targets for easier maintenance.
- Lifecycle bootstrap/update now manage OpenSpec compatibility automatically:
  - `pumuki install` bootstraps OpenSpec when missing,
  - `pumuki update --latest` migrates legacy `openspec` package to `@fission-ai/openspec` when needed.
- Evidence v2.1 payload now includes SDD observability:
  - `sdd_metrics` section in snapshot payload,
  - SDD blocking findings emitted with `source: "sdd-policy"`.
- Active documentation guardrails now enforce:
  - English-only baseline for active enterprise docs.
  - Local markdown reference integrity for active docs.
- Interactive framework menu now defaults to `Consumer` mode and separates the full surface behind `Advanced` mode (`A` to switch, `C` to return), with short inline help per option.

### Fixed

- Package smoke runner export wiring was restored for staged payload setup (`validation:package-smoke` / `validation:package-smoke:minimal`).
- `pumuki remove` now prunes only directories traceable to the Pumuki dependency tree, guaranteeing third-party dependency folders are never removed.
- `pumuki-pre-push` now fails safe when the branch has no upstream configured, returning `exit 1` with an explicit guidance message instead of silently evaluating `HEAD..HEAD`.
- Lifecycle git command execution now suppresses expected git stderr in fail-safe paths to avoid noisy output during deterministic tests.
- Framework menu report actions now resolve runner scripts from both consumer repo root and installed package root, enabling report generation from `npx pumuki-framework` in consumer repositories.
- Evidence traceability is now attached deterministically at evaluation time:
  - findings include `filePath`/`lines` when traceable from matched facts,
  - evidence v2.1 persists `matchedBy` and `source` for snapshot + compatibility violations,
  - baseline/skills findings no longer collapse to `file: "unknown"` when matching facts are available.

### Refactored

- Script-level SRP split for Phase 5 closure/status builders and adapter real-session evaluation/parsing helpers.

## [6.3.5] - 2026-02-10

### Added

- Deterministic guardrails for active documentation quality:
  - IDE/provider-agnostic language in active docs.
  - English-only baseline in active docs.
  - Index coverage and markdown-reference integrity checks.

### Changed

- Stage-gates suite expanded to include docs quality and package smoke export-contract guardrails.

### Fixed

- Package smoke staged payload export contract regression in repo setup helpers.

## Notes

- Canonical v2.x release narrative and operational detail live in:
  - `docs/operations/RELEASE_NOTES.md`
- Historical commit-level trace remains available via:
  - `git log`
  - `git show`
