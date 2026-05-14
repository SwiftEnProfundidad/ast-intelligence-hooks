# Release Notes (v2.x line)

This file tracks the active deterministic framework line used in this repository.
Canonical release chronology lives in `CHANGELOG.md`.
This file keeps only the operational highlights and rollout notes that matter while running the framework.

## 2026-04 (CLI stability and macOS notifications)

### 2026-05-14 (v6.3.263)

- Published `pumuki@6.3.263` with AST-style line/node evidence for `skills.ios.no-anyview`, making SwiftUI `AnyView` type erasure remediable through concrete composition, generics or `@ViewBuilder` branches.

### 2026-05-14 (v6.3.262)

- Published `pumuki@6.3.262` with AST-style line/node evidence for `skills.ios.no-force-cast`, making `as!` crashes remediable through conditional casts, typed boundaries or explicit mappers.

### 2026-05-14 (v6.3.261)

- Published `pumuki@6.3.261` with AST-style line/node evidence for `skills.ios.no-force-try`, making `try!` crashes remediable through `do/catch`, throwing boundaries or explicit fallback handling.

### 2026-05-14 (v6.3.260)

- Published `pumuki@6.3.260` with AST-style line/node evidence for `skills.ios.no-force-unwrap`, making postfix `!` crashes remediable through guarded optional handling or explicit failure paths.

### 2026-05-14 (v6.3.259)

- Published `pumuki@6.3.259` with AST-style line/node evidence for `skills.ios.prefer-swift-testing`, making modernizable `XCTestCase` suites remediable through native Swift Testing `import Testing`, `@Suite` and `@Test`.

### 2026-05-14 (v6.3.258)

- Published `pumuki@6.3.258` with AST-style line/node evidence for `skills.ios.no-xctunwrap`, making legacy `XCTUnwrap` calls remediable through Swift Testing `#require`.

### 2026-05-14 (v6.3.257)

- Published `pumuki@6.3.257` with AST-style line/node evidence for `skills.ios.no-xctassert`, making legacy `XCTAssert*`/`XCTFail` assertions remediable through Swift Testing `#expect`.

### 2026-05-14 (v6.3.256)

- Published `pumuki@6.3.256` with AST-style line/node evidence for the Quick/Nimble legacy iOS testing rule, preserving brownfield visibility while making native Swift Testing the actionable remediation for new test code.

### 2026-05-14 (v6.3.255)

- Published `pumuki@6.3.255` with AST-style line/node evidence for `skills.ios.no-mixed-testing-frameworks`, closing the XCTestCase + Swift Testing mixed-suite parity gap with a remediable split/migrate contract.

### 2026-05-14 (v6.3.254)
- **Paridad AST iOS testing:** `skills.ios.no-legacy-expectation-description` ancla `expectation(description:)` a líneas y nodos accionables, con reemplazo recomendado hacia `await confirmation(...)` o `await fulfillment(of:timeout:)`.
- **Rollout recomendado:** publicar `pumuki@6.3.254` y repinear consumers que dependan de paridad iOS/Swift Testing.

### 2026-05-14 (v6.3.253)

- **Paridad AST iOS testing:** `skills.ios.no-wait-for-expectations` queda respaldada por evidencia accionable de llamada Swift, con líneas, nodo primario y remediación hacia `await fulfillment(of:timeout:)`.
- **Rollout recomendado:** publicar `pumuki@6.3.253` y continuar con `skills.ios.no-legacy-expectation-description` si no entra bug externo nuevo.

### 2026-05-14 (v6.3.252)

- **Parser de tracking estricto:** el refresh SDD ya no interpreta bullets operativos (`Siguiente`, `next`, `delegable`) como IDs de task activa.
- **Rollout recomendado:** sustituir `6.3.251` por `6.3.252` en RuralGo y repetir `pumuki sdd session --refresh --ttl-minutes=90`.

### 2026-05-14 (v6.3.251)

- **Refresh SDD alineado con tracking activo:** `pumuki sdd session --refresh` deja de reutilizar silenciosamente una sesión antigua cuando `docs/RURALGO_SEGUIMIENTO.md` ya marca otra task activa.
- **Bloqueo accionable si falta OpenSpec:** si el tracking activo no existe en `openspec/changes`, el refresh falla con causa concreta en vez de producir una sesión válida pero semánticamente stale.
- **Rollout recomendado:** publicar `pumuki@6.3.251`, repinear RuralGo y revalidar `pumuki sdd session --refresh --ttl-minutes=90` sobre el slice Android activo.

### 2026-05-14 (v6.3.250)

- **Normalización iOS mode-aware:** la línea activa conserva reglas iOS automatizables con evidencia concreta y deja como declarativas las reglas greenfield/brownfield que requieren contexto de adopción, baseline o migración.
- **Package smoke estable para fixtures Git:** los commits y pushes internos de preparación del consumer smoke no disparan hooks del paquete bajo prueba; el gate real sigue validándose en los pasos explícitos del smoke.
- **Smokes no interactivos sin diálogos macOS:** `PUMUKI_SYSTEM_NOTIFICATIONS=0` y `PUMUKI_NOTIFICATIONS=0` vuelven a apagar el canal de sistema, evitando bloqueos por Swift dialog en validaciones de release.
- **Zero-violation real:** cualquier finding runtime emitido por regla activa bloquea; los matches scoped sin línea/rango/nodo AST dejan de publicarse como findings advisory.
- **AST accionable obligatorio:** los gaps sintéticos de cobertura cross-platform dejan de emitirse como findings sobre `.ai_evidence.json`; la cobertura queda como metadato diagnóstico y las findings runtime deben apuntar a código accionable.
- **Rollout recomendado:** publicar `pumuki@6.3.250` tras el test suite global verde; `validation:package-smoke`, metadata local y `PRE_WRITE` strict/advisory quedan alineados para esta versión.

### 2026-04-25 (v6.3.116)

- **Inventario local real de dependencias:** `status` y `doctor` conservan `trackedNodeModules*` como señal estricta de seguridad Git y añaden `dependencyInventory` como fuente de verdad de instalación local.
- **Cierre útil de `PUMUKI-INC-088`:** los consumers pueden ver si `pumuki` está declarado, instalado, con qué versión y si el binario local existe, sin inferirlo desde `git ls-files node_modules`.
- **Rollout recomendado:** publicar `pumuki@6.3.116`, repin inmediato en `RuralGo` y revalidar `status --json` / `doctor --json` comprobando `dependencyInventory.pumuki.installedVersion`.

### 2026-04-24 (v6.3.115)

- **`issues` canónicos también para `WARN`:** `status` y `doctor` ya no dejan `issues=[]` cuando la evidencia operativa real está en atención (`WARN`) pero aún no bloquea el gate.
- **Cierre útil de `PUMUKI-INC-084` en la línea publicada:** el consumer puede automatizar tanto estados `BLOCK` como `WARN` sin recombinar `attention_codes` y `human_summary_preview` por su cuenta.
- **`postinstall` vuelve a ser instalable en consumers reales:** la release evita el ciclo en `repoState` que rompía `npm install pumuki@6.3.114`.
- **Rollout recomendado:** publicar `pumuki@6.3.115`, repin inmediato en `RuralGo` y revalidar `status --json` / `doctor --json` comprobando que la evidencia `WARN` ya aparece dentro de `issues`.

### 2026-04-22 (v6.3.108)

- **MCP enterprise visible desde la baseline publicada:** la línea `main` deja de exigir opt-in adicional para exponer `ai_gate_check`, `pre_flight_check` y `auto_execute_ai_start` en el catálogo enterprise.
- **Menos gap entre governance y flujo real del editor/agente:** cuando `status`/`doctor` ya están bloqueando, el consumer pasa a ver antes la misma capa MCP que materializa el enforcement perceptible de `PRE_WRITE`.
- **Rollout recomendado:** publicar `pumuki@6.3.108`, repin inmediato en `RuralGo` y revalidar `status`, `doctor` y el arranque MCP/agentic sobre un repo con `PUMUKI-INC-079` reportada.

### 2026-04-22 (v6.3.107)

- **Sesión SDD expirada sin semántica ambigua:** la línea publicada deja de diagnosticar sesiones vencidas como `active=true` con `valid=false`; ahora las proyecta como inactivas y mantiene la señal de expiración con `remainingSeconds=0`.
- **Refresh reproducible de sesiones caducadas:** si el `changeId` sigue siendo válido, `session --refresh` vuelve a servir para recuperar la sesión sin exigir un `session --open` innecesario.
- **Rollout recomendado:** publicar `pumuki@6.3.107`, repin inmediato en `RuralGo` y revalidar `sdd validate --stage=PRE_WRITE --json` comprobando que `status.session.active=false`, `valid=false` y que la remediación siga permitiendo refresh sobre el mismo `changeId`.

### 2026-04-22 (v6.3.106)

- **Cierre útil del literal residual en RuralGo:** `sdd validate --stage=PRE_WRITE --json` ya no recomienda activar SDD con `pumuki@latest`; devuelve el mismo runtime versionado que está diagnosticando.
- **Guía de sesión SDD alineada:** `session --refresh` y `session --open` quedan versionados para evitar drift en repos consumidores.
- **Rollout recomendado:** publicar `pumuki@6.3.106`, repin inmediato en `RuralGo` y revalidar `sdd validate --stage=PRE_WRITE --json` comprobando `activation_command` fijo a `6.3.106`.

### 2026-04-22 (v6.3.105)

- **Remediación reproducible en la línea publicada:** las rutas bloqueantes de `PRE_WRITE` dejan de sugerir `pumuki@latest` y fijan la versión efectiva del runtime al construir `next_action.command`.
- **Cobertura MCP alineada:** `auto_execute_ai_start` devuelve las mismas remediaciones versionadas que `sdd validate` para evidence invalid/stale, `active_rule_ids` vacío y policy reconcile estricto.
- **Rollout recomendado:** publicar `pumuki@6.3.105`, repin inmediato en `RuralGo` y revalidar el command contract de `PRE_WRITE` en `sdd validate`, `auto_execute_ai_start` y hooks reales.

### 2026-04-22 (v6.3.104)

- **RuralGo hub-aware diagnostics:** `TRACKING_CANONICAL_IN_PROGRESS_INVALID` pasa a enriquecer su mensaje usando `docs/RURALGO_SEGUIMIENTO.md` cuando ese hub es el board canónico del consumer.
- **Compatibilidad con tablas del hub:** el parser reconoce filas `| 🚧 | TASK_ID |` y las devuelve como entradas activas accionables.
- **Rollout recomendado:** publicar `pumuki@6.3.104`, repin inmediato en `RuralGo` y revalidar `status` / `doctor` / `pumuki-pre-write` con doble fila `🚧` temporal en el hub canónico.

### 2026-04-22 (v6.3.103)

- **Tracking canónico accionable:** `status`, `doctor` y el gate repo-policy enriquecen `TRACKING_CANONICAL_IN_PROGRESS_INVALID` con referencias a las entradas activas detectadas en el board del consumer.
- **PRE_WRITE menos ambiguo:** cuando un warning de higiene de worktree convive con un bloqueo duro, el runtime imprime `warning-summary` separado del `block-summary`.
- **Rollout recomendado:** publicar `pumuki@6.3.103`, repin inmediato en `RuralGo` y revalidar `status` / `doctor` / `git commit` sobre un board con varias filas `🚧 reported activo`.

### 2026-04-22 (v6.3.102)

- **Convergencia de policy efectiva:** `strict` deja de depender solo de `PUMUKI_POLICY_STRICT` cuando el contrato firmado ya lo declara por stage; `status`, `doctor` y runtime vuelven a hablar el mismo idioma.
- **Autofix persistente de contrato:** `policy reconcile --strict --apply` escribe el mapa `strict` completo en `.pumuki/policy-as-code.json`, cerrando la deriva entre reconcile y lectura posterior.
- **Wiring fiable en `pre-push`:** el hook gestionado se antepone también cuando el hook previo termina en `exec`, evitando bloques inalcanzables.
- **Rollout recomendado:** publicar `pumuki@6.3.102`, repin inmediato en `RuralGo` y revalidar `status` / `doctor` / `pre-push` para cerrar `PUMUKI-INC-080`.

### 2026-04-22 (v6.3.101)

- **Hotfix de ruta bloqueante:** `gate.blocked` deja de lanzar `ReferenceError: options is not defined` al construir la remediación visible en `PRE_WRITE`.
- **Rollout recomendado:** publicar `pumuki@6.3.101`, repin inmediato en `RuralGo` y revalidar que el bloqueo de `PRE_WRITE` termina limpio, sin error residual tras el panel.

### 2026-04-22 (v6.3.100)

- **Hotfix de activación efectiva:** la línea publicada deja de resolver `PRE_WRITE` a `off/default` en ausencia de override explícito; el default vuelve a ser coercitivo para el flujo real del agente/editor.
- **Rollout recomendado:** publicar `pumuki@6.3.100` y revalidar en `RuralGo` que `status`/`doctor` ya no presenten `pre_write.mode=off source=default`.

### 2026-04-22 (v6.3.99)

- **Hotfix de coerción temprana:** `PRE_WRITE` deja de parecer advisory cuando realmente está activado en `strict`, y el arranque agentic devuelve fallo real al bloquear.
- **Rollout recomendado:** publicar `pumuki@6.3.99` y repin inmediato en `RuralGo`, validando `pumuki:status`, `pumuki:doctor`, `pre-commit` y `pre-push` con el fix de `PUMUKI-INC-079`.

### 2026-04-11 (v6.3.72)

- **Tarball npm**: `package.json` → `files` incluye `AGENTS.md`, `CHANGELOG.md` y `docs/tracking/plan-curso-pumuki-stack-my-architecture.md` para lectura canónica vía npm / jsDelivr sin depender solo del repo Git.
- **`gate.blocked` (macOS)**: banner de Notification Center **y** modal por defecto (evita cero notificaciones si el modal no llega a mostrarse desde un hook); dedupe opcional: `PUMUKI_MACOS_GATE_BLOCKED_BANNER_DEDUPE=1`.
- **Modal Swift**: `NSAlert.runModal()` en lugar de panel flotante para que los botones del diálogo respondan de forma fiable.
- **Postinstall consumer**: por defecto `pumuki install --with-mcp --agent=repo` y fusión conservadora en `.pumuki/adapter.json` (`json-merge`); opt-out `PUMUKI_POSTINSTALL_SKIP_MCP=1`.
- **Validación local**: `smoke:pumuki-surface` / `smoke:pumuki-surface-installed` y `validation:local-merge-bar` (sin depender de minutos de Actions). Detalle en `docs/validation/README.md`.
- **Tests en macOS:** `integrations/lifecycle/__tests__/cli.test.ts` evita notificaciones reales del sistema (`PUMUKI_DISABLE_SYSTEM_NOTIFICATIONS` en hooks) para que `npm test` / la barra local no queden colgados en PRE_WRITE strict.
- **Menú / matriz consumer**: opciones motor `11–14`, matriz baseline alineada, vista classic opcional, etc. (ver `CHANGELOG.md`).
- **Rollout**: `pumuki@6.3.72`; `npm publish` cuando el tarball incluya lo anterior; luego `pumuki doctor --json` + repin en consumidores (p. ej. RuralGO).

### 2026-04-06 (v6.3.71)

- **Evidencia v2.1**: bloque `operational_hints` (`requires_second_pass`, resumen operativo, desglose por severidad de reglas). Alineado con PRE_COMMIT solo-docs + evidencia trackeada (INC-069) cuando no se re-stagea el JSON automáticamente.
- **Monorepo**: `PUMUKI_GATE_SCOPE_PATH_PREFIXES` acota el primer alcance de hechos por prefijos de ruta.
- **Paridad CI/local**: `pumuki doctor --parity` y fichero opcional `.pumuki/ci-parity-expected.json` (fallo con exit 1 si hay drift respecto al esperado).
- **MCP y hooks**: mismas pistas de remediación por código de violación vía catálogo compartido.
- **Rollout**: `pumuki@6.3.71`; repin en consumidores cuando se publique npm; validar hooks y `doctor --parity` si fijáis expectativas de CI.

### 2026-04-06 (v6.3.70)

- **Consumidores con pre-commit en pre-push**: con `.ai_evidence.json` **versionado**, `PRE_PUSH` en **ALLOW/WARN** omite persistir en disco para no ensuciar el árbol tras el gate; variable `PUMUKI_PRE_PUSH_ALWAYS_WRITE_TRACKED_EVIDENCE=1` si necesitas el snapshot `PRE_PUSH` en fichero trackeado (puede exigir flujo de commit explícito).
- **macOS bloqueo**: un solo canal interactivo cuando el modal está activo (sin banner `osascript` paralelo); panel Swift más fiable para foco y clics en botones.
- **Rollout**: `pumuki@6.3.70`, repin en monorepos (p. ej. RuralGO); `npm test` / `git push` con hooks encadenados como validación.

### 2026-04-05 (v6.3.69)

- **Hooks = política de repo**: `PRE_COMMIT` / `PRE_PUSH` / `CI` / `PRE_WRITE` incorporan **`GITFLOW_PROTECTED_BRANCH`** y **higiene de worktree** (`EVIDENCE_PREWRITE_WORKTREE_*`, env `PUMUKI_PREWRITE_WORKTREE_*`) vía fusión con `evaluateAiGate` en `runPlatformGate`.
- **macOS bloqueos**: modal **Desactivar / Silenciar 30 min / Mantener activas** **on by default** si las notificaciones están habilitadas; normalización de etiquetas y parseo `osascript` más robusto; `gate.blocked` duplica payload en **stderr** por defecto (`PUMUKI_DISABLE_GATE_BLOCKED_STDERR_MIRROR=1` para opt-out).
- **Rollout**: `pumuki@6.3.69`, **`pumuki install`** en consumidores si quieren hooks reescritos tras cambios previos; revisar `.pumuki/system-notifications.json` si asumías modal apagado sin clave `blockedDialogEnabled`.

### 2026-04-06 (v6.3.68)

- **PRE_WRITE sin depender del IDE**: `pre-commit` y `pre-push` gestionados ejecutan **`pumuki-pre-write`** antes del gate del stage principal. Opt-out: `PUMUKI_SKIP_CHAINED_PRE_WRITE=1`.
- **`.pumuki/adapter.json`**: se crea en `pumuki install` si faltaba, con comandos de **MCP stdio** y hooks (plantilla `repo`); sigue sin imponer Cursor ni otros IDEs.
- Rollout: `pumuki@6.3.68` y **`pumuki install`** en consumidores para reescribir hooks.

### 2026-04-06 (v6.3.67)

- **Corrección de producto**: el `postinstall` **no** acopla Pumuki a Cursor ni a ningún IDE. Vuelve a ejecutar solo **`pumuki install`** (baseline Git + lifecycle). IDE/MCP: opt-in con `pumuki install --with-mcp --agent=…` o `bootstrap --enterprise`.
- La plantilla adaptador **Cursor** sigue pudiendo fusionar `.cursor/mcp.json` y escribir `.pumuki/adapter.json` cuando el equipo elige ese agente explícitamente.
- Rollout: `pumuki@6.3.67` si **6.3.66** llegó a publicarse; si no, repin directo a **6.3.67**.

### 2026-04-06 (v6.3.65)

- **pre-commit.com + `exec`**: Pumuki ya no inserta su bloque gestionado *después* del `exec` del hook generado por pre-commit (código inalcanzable). Tras actualizar a **6.3.65**, ejecutar `pumuki install` en el consumer para reordenar `.git/hooks/pre-commit`.
- Rollout: repin a `pumuki@6.3.65`; validar que un `git commit` dispara el gate (salida `[pumuki]` / policy) antes de que corra pre-commit.

### 2026-04-05 (v6.3.64)

- **Notificaciones multiplataforma**: fuera de macOS, avisos críticos van a **stderr** por defecto (terminal visible). `PUMUKI_DISABLE_STDERR_NOTIFICATIONS=1` lo silencia para CI/scripts. En macOS, `PUMUKI_NOTIFICATION_STDERR_MIRROR=1` añade copia en terminal; si `osascript`/banner falla, stderr actúa como respaldo.
- Rollout: repin a `pumuki@6.3.64`; validar hooks y, si usáis notificaciones, comprobar salida en entorno no-macOS.

### 2026-04-05 (v6.3.63)

- **Auto-wire on install**: el paquete npm ejecuta `postinstall` → `pumuki install` en el repo del consumidor (`INIT_CWD`) cuando hay `.git`. Saltar con `PUMUKI_SKIP_POSTINSTALL=1` o en CI. OpenSpec bootstrap sigue omitido en ese camino (`PUMUKI_SKIP_OPENSPEC_BOOTSTRAP` por defecto ahí). MCP en Cursor/Codex no se configura solo: usar `pumuki install --with-mcp` / adaptador cuando proceda.
- **Best-effort**: si `doctor` bloquea, el postinstall puede cablear hooks en modo degradado para no dejar el paquete “muerto” en el hook chain.

### 2026-04-05 (v6.3.62)

- Merged `refactor/cli-complexity-reduction-phase4-rebase2` into `develop` (PR #731); GitHub Actions quota may block CI—validate locally with `npm test` before consuming.
- macOS: blocked-notification **modal opt-in**; banner remains default; Swift notification panel behavior tightened.
- Suite alignment for `PRE_WRITE` / policy JSON across lifecycle, gate, and git integration tests; `brownfieldHotspots` test coverage added.
- Rollout: repin consumers to `pumuki@6.3.62`, then re-run `pumuki status` / `pumuki doctor` / hooks as applicable; manual macOS check recommended for notification actions writing `.pumuki/system-notifications.json` in the **real** repo root.

## 2026-03 (enterprise hardening updates)

### 2026-03-14 (v6.3.61)

- Support surface removed from product baseline:
  - consumer support bundle, startup triage, adapter readiness and phase5 closure helpers are now presented as auxiliary support toolkit,
  - product docs and menu labels no longer describe that surface as baseline framework behavior.
- Canonical support namespace:
  - new primary npm commands: `toolkit:*`,
  - legacy `validation:*` commands remain only as compatibility aliases for existing automations.
- Legacy escalation/handoff surface frozen:
  - `phase5-latest`, `phase5-escalation`, `phase8` and final external handoff/reporting now live under `toolkit:legacy:*`,
  - shell chains and next-command hints already point to `toolkit:legacy:*` instead of treating `validation:*` as the primary contract.
- Operational impact:
  - the product baseline stays focused on install/status/doctor/gate,
  - support and rollout helpers remain available without contaminating the core surface,
  - frozen escalation chains stay callable for legacy workflows but leave the official product API.
- Legacy export/reporting downgraded to read-only snapshots:
  - legacy markdown export and consumer runtime export now declare themselves as `legacy read-only evidence snapshots`,
  - they no longer publish prescriptive `next_action` / `blocked` copy or act as a parallel gate summary outside canonical `status` / `doctor`.
- Consumer menu shell parity tightened:
  - consumer mode now groups `1/2/3/4` as canonical read-only gate flows, `8` as the matching read-only markdown export, and `5/6/7/9` as `Legacy Read-Only Diagnostics`,
  - fixture validation on `ios-architecture-showcase` confirms parity between gate execution, menu summary, and exported markdown snapshot.
- Fixture acceptance baseline added:
  - `validation:consumer-matrix-baseline` now runs repeated consumer matrix rounds against a real fixture repo,
  - the command emits `report.json` + `summary.md` under `.audit-reports/fixture-matrix/<fixture>/consumer-menu-matrix-baseline/`, adds `doctor_blocking` plus `layerSummary`, and fails fast on drift,
  - real baselines on `2026-03-14` are already stable for `ios-architecture-showcase`, `SAAS:APP_SUPERMERCADOS`, and `R_GO`, which makes per-layer acceptance visible before any promotion to blocking.
- Release readiness frozen for the reset:
  - release decision now depends on an explicit checklist (`typecheck`, enterprise contract suite, package manifest, both package smokes, and the three fixture baselines),
  - publication is allowed only from `release/<semver>` cut from `develop`,
  - rollback is defined as previous stable semver + consumer repin + revalidation of `status` / `doctor` / fixture baseline.

### 2026-03-11 (v6.3.57)

- AST intelligence and gate payload enrichment:
  - heuristic extraction now contributes richer semantic context for TypeScript, iOS and Android findings,
  - downstream evidence and gate evaluation preserve that traceability for consumers, receipts and diagnostics.
- Canonical enterprise skill packaging:
  - vendored `vendor/skills/*` and `docs/codex-skills/*-enterprise-rules.md` are now treated as the canonical packaged skill surface,
  - release tooling and manifest validation no longer point to legacy `windsurf-rules-*` markdown names.
- Operational impact:
  - published tarballs and runtime validation now agree on the same enterprise skill chain,
  - consumers receive richer semantic findings without relying on ad-hoc local rule metadata.
- Validation evidence:
  - `npm run -s typecheck` (`PASS`)
  - `npx --yes tsx@4.21.0 --test core/facts/HeuristicFact.test.ts core/facts/__tests__/extractHeuristicFacts.test.ts core/facts/detectors/text/android.test.ts core/facts/detectors/text/ios.test.ts core/facts/detectors/typescript/index.test.ts core/gate/Finding.test.ts core/rules/presets/androidRuleSet.test.ts core/rules/presets/iosEnterpriseRuleSet.test.ts core/rules/presets/rulePackVersions.test.ts integrations/config/__tests__/skillsCustomRules.test.ts integrations/config/__tests__/skillsEffectiveLock.test.ts integrations/config/__tests__/skillsRuleSet.test.ts integrations/evidence/generateEvidence.test.ts integrations/gate/__tests__/evaluateAiGate.test.ts integrations/git/__tests__/findingTraceability.test.ts integrations/git/__tests__/runPlatformGate.test.ts integrations/git/__tests__/runPlatformGateEvaluation.test.ts` (`250 pass / 0 fail`)
  - `npm run -s validation:package-manifest` (`PASS`)

### 2026-03-11 (v6.3.56)

- Hook hygiene hotfix:
  - `PRE_COMMIT` stops re-staging `.ai_evidence.json` when the file is tracked but was not part of the original staged set.
- Operational impact:
  - consumers no longer get accidental evidence churn in otherwise unrelated commits.

### 2026-03-06 (v6.3.55)

- Safe remediation for consumers whose repository path breaks `PATH` execution:
  - `status` / `doctor` now detect when the repo root contains the platform `PATH` delimiter,
  - the JSON contract exposes:
    - `version.pathExecutionHazard`
    - `version.pathExecutionWarning`
    - `version.pathExecutionWorkaroundCommand`
  - `version.alignmentCommand` now falls back to a safe local-node invocation when `npx/npm exec` would be unsafe.
- Human-readable lifecycle output now explains the problem directly:
  - `execution warning: ...`
  - `execution workaround: node ./node_modules/pumuki/bin/pumuki.js ...`
- Operational impact:
  - consumers like `SAAS:APP_SUPERMERCADOS` no longer depend on broken `PATH` rewriting for lifecycle remediation,
  - the workaround is deterministic and machine-readable instead of tribal knowledge.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/packageInfo.test.ts integrations/lifecycle/__tests__/status.test.ts integrations/lifecycle/__tests__/doctor.test.ts integrations/lifecycle/__tests__/cli.test.ts` (`pass`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-06 (v6.3.54)

- Consumer package/runtime correctness:
  - the npm tarball now includes `docs/codex-skills/*.md`,
  - core skills can be compiled from `skills.sources.json` inside `node_modules/pumuki` in real consumers.
- Skills coverage gate no longer loses vendored backend/frontend/iOS/Android bundles just because the published package omitted their markdown sources.
- Package manifest hardening:
  - the package manifest guard now treats the vendored codex skill markdown files as required runtime assets,
  - future releases will fail package validation if those sources disappear from the tarball.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test scripts/__tests__/package-manifest-lib.test.ts scripts/__tests__/check-package-manifest.test.ts` (`12 pass / 0 fail`)
  - `npm run -s validation:package-manifest` (`PASS`)
  - `npm pack --json --dry-run` verified all six `docs/codex-skills/*.md` files are present
  - `npm run -s typecheck` (`PASS`)

### 2026-03-06 (v6.3.53)

- Cross-repo watch correctness:
  - `pumuki watch` now evaluates the requested `repoRoot` end-to-end, both when collecting facts and when executing the gate.
  - Avoids false blocks and notifications sourced from the wrong checkout in fleet-style usage.
- PRE_WRITE hygiene accuracy:
  - worktree hygiene now uses a deduplicated pending file count when repo state exposes it,
  - prevents partially staged files (`MM`) from counting twice toward warn/block thresholds.
- Custom rules drift fidelity:
  - custom bundle hashes now include `ast_node_ids`,
  - changing the AST coverage of an `AUTO` custom rule now correctly changes the bundle hash and downstream drift signals.
- MCP evidence remediation:
  - `auto_execute_ai_start` now handles `EVIDENCE_CHAIN_INVALID` with the same actionable evidence regeneration guidance as other evidence failures.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/watch.test.ts integrations/gate/__tests__/evaluateAiGate.test.ts integrations/config/__tests__/skillsCustomRules.test.ts integrations/mcp/__tests__/autoExecuteAiStart.test.ts` (`50 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-06 (v6.3.52)

- Version contract clarity in `status` / `doctor`:
  - `packageVersion` remains for backward compatibility, but both commands now expose a structured `version` block with:
    - `effective`
    - `runtime`
    - `consumerInstalled`
    - `lifecycleInstalled`
    - `source`
    - `driftFromRuntime`
    - `driftFromLifecycleInstalled`
    - `driftWarning`
- Human-readable diagnostics now distinguish clearly between:
  - the runtime used to execute the command,
  - the version installed in `node_modules` of the consumer,
  - the version persisted in lifecycle hook state.
- Operational impact:
  - post-release consumer smokes no longer require guesswork when `@latest`, installed dependency and managed hooks are not aligned.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/packageInfo.test.ts integrations/lifecycle/__tests__/status.test.ts integrations/lifecycle/__tests__/doctor.test.ts integrations/lifecycle/__tests__/cli.test.ts` (`66 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-06 (v6.3.51)

- Hook hygiene fix in `PRE_COMMIT`:
  - `.ai_evidence.json` no longer remains dirty after a successful commit when it was already tracked,
  - the hook re-stages refreshed evidence deterministically instead of leaving post-commit drift.
- Historical publish fix in `PRE_PUSH`:
  - when the hook publishes an exact commit, Pumuki now evaluates the real `remoteOid..localOid` range instead of dragging the whole `upstream..HEAD`,
  - when that publish targets a historical commit different from current `HEAD`, SDD session enforcement is suspended in a controlled way to avoid false blocks tied to the current workspace session.
- `pumuki sdd evidence` DX improvement:
  - `--test-output` remains restricted to paths inside the repo root,
  - the error now suggests a valid ephemeral destination such as `.pumuki/runtime/<file>.log`.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts integrations/git/__tests__/runPlatformGate.test.ts integrations/sdd/__tests__/evidenceScaffold.test.ts integrations/lifecycle/__tests__/cli.test.ts` (`125 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-05 (v6.3.50)

- Atomicity remediation clarity (`GIT_ATOMICITY_TOO_MANY_SCOPES`):
  - blocking message now includes `scope_files=` with per-scope file breakdown,
  - remediation now includes explicit `Sugerencia split` wording for deterministic staging split.
- Gate summary `next_action` updated for this code:
  - explicitly instructs to use `scope_files` before running split commands.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/gitAtomicity.test.ts integrations/git/__tests__/runPlatformGateOutput.test.ts` (`9 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-05 (v6.3.49)

- Watch JSON contract clarity for staged scope:
  - `lastTick.changed` now reflects real scoped file delta, not merely tick execution.
  - In `scope=staged` with no staged files:
    - `changed=false`
    - `changedFiles=[]`
    - `evaluatedFiles=[]`
- Operational impact:
  - prevents false interpretation of activity in consumer diagnostics and backlog evidence.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/watch.test.ts` (`6 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)
  - consumer smoke (Flux, local core bin): `watch --once --stage=PRE_COMMIT --scope=staged --json` -> `changed=false` with empty arrays.

### 2026-03-05 (v6.3.48)

- Anti-drift hardening for consumer validation flows:
  - `pumuki watch` now applies manifest integrity guard and restores unexpected mutations to:
    - `package.json`
    - `package-lock.json`
    - `pnpm-lock.yaml`
    - `yarn.lock`
  - If mutation is detected, watch blocks with `MANIFEST_MUTATION_DETECTED`.
- Hook hardening parity:
  - `pre-commit` / `pre-push` manifest guard now covers npm + pnpm + yarn lockfiles (not only npm).
- Operational impact:
  - avoids silent manifest/lockfile drift in consumers during validation loops unless upgrade is explicitly requested.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/watch.test.ts integrations/git/__tests__/stageRunners.test.ts` (`38 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)
  - consumer smoke (Flux, local core bin): `watch --once --json` with hashes unchanged for `package.json` / `pnpm-lock.yaml`.

### 2026-03-05 (v6.3.47)

- Manifest integrity hardening in hook stages (`PRE_COMMIT` / `PRE_PUSH`):
  - Pumuki now snapshots `package.json` and `package-lock.json` before hook gate execution.
  - If an unexpected mutation appears during the hook flow, Pumuki restores both files automatically and blocks with:
    - `MANIFEST_MUTATION_DETECTED`
- Operational impact:
  - avoids silent consumer manifest drift while keeping explicit upgrade flows (`pumuki update --latest`) under developer control.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts` (`32 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)
  - consumer check with local bin in RuralGo: hashes of `package.json`/`package-lock.json` unchanged after `PRE_WRITE + pre-commit + pre-push`.

### 2026-03-05 (v6.3.46)

- Paridad hook/watch en auto-remediación de skills coverage:
  - `pre-commit` y `pre-push` ahora ejecutan `policy reconcile --strict --apply` y reintentan una única vez cuando el bloqueo es de coverage de skills.
  - elimina recurrencia de bootstrap/reconcile manual entre iteraciones de consumer.
- Contrato `watch --json` enriquecido para drift de versión:
  - nuevo bloque `version` con `effective/runtime/consumerInstalled/source`,
  - incluye `driftFromRuntime` y `driftWarning` cuando el binario del consumer no está alineado con runtime/latest.
- Evidencia de validación:
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts` (`30 pass / 0 fail`)
  - `npx --yes tsx@4.21.0 --test integrations/lifecycle/__tests__/watch.test.ts integrations/lifecycle/__tests__/cli.test.ts` (`48 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-05 (v6.3.45)

- SDD sync canónico ampliado por defecto en consumer:
  - `pumuki sdd sync-docs` ahora sincroniza, cuando existen, los 3 documentos base:
    - `docs/strategy/ruralgo-tracking-hub.md`
    - `docs/technical/08-validation/refactor/operational-summary.md`
    - `docs/validation/refactor/last-run.json`
- Auto-sync OpenSpec integral por cambio:
  - `pumuki sdd auto-sync` incluye por defecto:
    - `openspec/changes/<change>/tasks.md`
    - `openspec/changes/<change>/design.md`
    - `openspec/changes/<change>/retrospective.md`
- Consumo automático universal de aprendizaje:
  - `ai_gate_check`, `pre_flight_check` y `auto_execute_ai_start` exponen `learning_context` cuando existe `openspec/changes/<change>/learning.json`.
- Evidencia de validación:
  - `npx --yes tsx@4.21.0 --test integrations/mcp/__tests__/aiGateCheck.test.ts integrations/mcp/__tests__/preFlightCheck.test.ts integrations/mcp/__tests__/autoExecuteAiStart.test.ts integrations/sdd/__tests__/syncDocs.test.ts integrations/lifecycle/__tests__/cli.test.ts` (`78 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-05 (v6.3.43)

- `pumuki sdd evidence` alinea su salida con el contrato TDD/BDD del gate:
  - `version: "1"` (antes `1.0`),
  - `slices[]` generado por defecto con estructura `red/green/refactor`.
- Compatibilidad de transición mantenida:
  - el artefacto conserva campos legacy (`scenario_id`, `test_run`, `ai_evidence`) para flujos existentes,
  - `pumuki sdd state-sync` acepta source evidence `version=1` y `version=1.0`.
- Evidencia de validación:
  - `npx --yes tsx@4.21.0 --test integrations/sdd/__tests__/evidenceScaffold.test.ts integrations/sdd/__tests__/stateSync.test.ts integrations/lifecycle/__tests__/cli.test.ts` (`47 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)
  - smoke real en Flux con CLI local: `pumuki sdd evidence ... --json` -> artefacto `version: "1"` con `slices[]`.

### 2026-03-05 (v6.3.42)

- Modal flotante de bloqueo (macOS) ajustado para legibilidad real:
  - crecimiento preferente en vertical según contenido,
  - ancho acotado para evitar diálogos excesivamente horizontales,
  - tipografía más compacta para causa/solución.
- Remediación por defecto más accionable en bloqueos:
  - mensajes enriquecidos para `EVIDENCE_*`, `PRE_PUSH_UPSTREAM_MISSING`, `SDD_SESSION_*`,
  - más contexto operativo sin truncado agresivo.
- Ajustes de robustez visual:
  - wrapping explícito multilínea en campos del modal,
  - pinning bottom-right estable tras recalcular layout.
- Evidencia de validación:
  - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-system-notifications.test.ts integrations/mcp/__tests__/aiGateCheck.test.ts integrations/mcp/__tests__/autoExecuteAiStart.test.ts integrations/mcp/__tests__/preFlightCheck.test.ts integrations/git/__tests__/runPlatformGate.test.ts integrations/git/__tests__/runPlatformGateOutput.test.ts integrations/git/__tests__/gitAtomicity.test.ts integrations/sdd/__tests__/policy.test.ts integrations/sdd/__tests__/sessionStore.test.ts` (`94 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-05 (v6.3.41)

- UX de notificaciones de bloqueo mejorada para escenarios multi-repo:
  - el subtítulo ahora incluye proyecto/repositorio (`<project> · <stage> · <causa>`),
  - facilita distinguir bloqueos cuando hay varios repos abiertos.
- Modal de bloqueo en macOS ahora activa por defecto en `gate.blocked`:
  - sin requerir `PUMUKI_MACOS_BLOCKED_DIALOG=1`,
  - override explícito soportado con `PUMUKI_MACOS_BLOCKED_DIALOG=0|1`.
- Contrato de configuración de notificaciones endurecido:
  - `blockedDialogEnabled` persistido y leído de forma determinista.
- Evidencia de validación:
  - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-system-notifications.test.ts` (`13 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)

### 2026-03-05 (v6.3.40)

- AST Intelligence dual validation PoC (`#616`) integrado en gate:
  - runtime mode: `PUMUKI_AST_INTELLIGENCE_DUAL_MODE=off|shadow|strict`.
  - `shadow`: comparación legacy vs AST por nodos sin bloqueo.
  - `strict`: bloqueo cuando hay divergencias.
  - métricas en runtime: `mapped_rules`, `divergences`, `false_positives`, `false_negatives`, `latency_ms`, `languages`.
- Señales de gate añadidas:
  - `governance.ast-intelligence.dual-validation.shadow`
  - `governance.ast-intelligence.dual-validation.mismatch`
- Backlog tooling (`watch/reconcile`) amplía contrato JSON en `next_commands[]`:
  - nuevo campo `probe_kind` (`json_contract` | `state_recheck`) para tipar verificación post-ejecución.
- Correcciones de robustez operativa en consumidores reales:
  - `PRE_PUSH` detecta upstream desalineado antes de evaluar scope coverage (evita falsos positivos de plataforma por delta contaminado).
  - smoke de instalación local hace fallback cuando `npx --no-install` falla por `MODULE_NOT_FOUND`.
  - `ai_gate_check` unifica hint de precedencia para códigos legacy `EVIDENCE_*` (incluye `EVIDENCE_INTEGRITY_MISSING`).
- RFC y plan de rollout/rollback:
  - `docs/validation/ast-intelligence-validation-roadmap.md`.
- Evidencia de validación:
  - `npx --yes tsx@4.21.0 --test scripts/__tests__/backlog-cli-help-exit-code.test.ts` (`11 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)
  - `npm run -s test:stage-gates` (`1033 pass / 0 fail / 4 skip`)

### 2026-03-04 (next cut candidate, post v6.3.39)

- Gate coverage hardening for SAAS backlog (`#622`):
  - when code changes are present and `active_rule_ids` is empty, gate now blocks with:
    - finding id: `governance.rules.active-rule-coverage.empty`
    - code: `ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES_HIGH`
- iOS test quality hardening for SAAS backlog (`#623`):
  - for XCTest sources in `apps/ios/**/Tests/**.swift`, gate now requires:
    - `makeSUT()`
    - `trackForMemoryLeaks()`
  - blocking signal:
    - finding id: `governance.skills.ios-test-quality.incomplete`
    - code: `IOS_TEST_QUALITY_PATTERN_MISSING_HIGH`
- Gate traceability consistency:
  - fixed propagation of guard findings to `effectiveFindings` so `BLOCK` outcomes are always accompanied by explicit finding payload.
- Validation evidence:
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/runPlatformGate.test.ts` (`32 pass / 0 fail`)
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts` (`21 pass / 0 fail`)
  - `npm run -s typecheck` (`PASS`)
  - `npm run -s test:stage-gates` (`1024 pass / 0 fail / 4 skip`)

### 2026-03-04 (v6.3.39)

- Adapter/runtime bootstrap hardening:
  - adapter-generated hooks/CI templates now use `npx --yes --package pumuki@latest ...` for deterministic command resolution in consumer repos.
- Git-range robustness:
  - commit-range facts now guard unresolved refs (`rev-parse --verify`) and avoid ambiguous failures on repos without `HEAD`.
- Cross-platform critical enforcement:
  - gate now blocks when a detected platform does not have critical (`CRITICAL/ERROR`) skills rules active/evaluated.
  - finding id: `governance.skills.cross-platform-critical.incomplete`.
- Git atomicity by default:
  - atomicity guard is enabled by default in core gate flow (`PRE_COMMIT/PRE_PUSH/CI`).
  - keeps env/config overrides for enterprise tuning without patching source.
- Versioned hooks diagnostics hardening (`core.hooksPath`):
  - lifecycle hook resolution now includes fallback to local `.git/config` (`core.hooksPath`) when `git rev-parse --git-path hooks` is unavailable.
  - `status/doctor` now expose effective hook path metadata (`hooksDirectory`, `hooksDirectoryResolution`) and print it in human-readable mode.
- Validation hardening:
  - `test:stage-gates` stabilized and green with current contracts (`1020 pass / 0 fail / 4 skip`).
  - fixtures aligned to evidence v2.1 (`evidence_chain`, `evidence.source`) and architecture guardrail overrides updated for `integrations/lifecycle/cli.ts`.
- Traceability:
  - commits: `104fc92`, `2f175ec`, `da7b073`, `2c40a4c`, `b124599`, `2aeb435`
- Consumer quick verification:
  - `npx --yes --package pumuki@latest pumuki status --json`
  - `npx --yes --package pumuki@latest pumuki doctor --json`
  - `npm run -s typecheck`
  - `npm run -s test:stage-gates`

### 2026-03-04 (v6.3.38)

- Blocked notification UX hardening for macOS:
  - short, human-readable Spanish banner (`🔴 Pumuki bloqueado`) with stage + summarized cause.
  - remediation-first body (`Solución: ...`) to maximize visibility in truncated notification banners.
- Optional blocked-dialog workflow (`PUMUKI_MACOS_BLOCKED_DIALOG=1`):
  - full cause/remediation modal for critical blocks.
  - anti-spam controls in dialog:
    - `Mantener activas`
    - `Silenciar 30 min`
    - `Desactivar`
  - `giving up after 15` timeout to avoid local execution hangs.
- Notification delivery contract update:
  - config supports `muteUntil` in `.pumuki/system-notifications.json`.
  - delivery result now reports `reason=muted` while silence window is active.
- Regression baseline alignment:
  - `integrations/git/__tests__/stageRunners.test.ts` updated to run with core skills enabled in test harness, matching current gate contract and eliminating false failures.
- Traceability:
  - commits: `2f957a2`, `ceb1849`, `98fc108`, `ae90f31`
- Consumer quick verification:
  - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-system-notifications.test.ts`
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts`
  - `PUMUKI_MACOS_BLOCKED_DIALOG=1 npx --yes tsx@4.21.0 -e "import { emitSystemNotification } from './scripts/framework-menu-system-notifications-lib'; console.log(JSON.stringify(emitSystemNotification({ repoRoot: process.cwd(), event: { kind: 'gate.blocked', stage: 'PRE_COMMIT', totalViolations: 1, causeCode: 'BACKEND_AVOID_EXPLICIT_ANY', causeMessage: 'Avoid explicit any in backend code.', remediation: 'Tipa el valor y elimina any explícito en backend.' } })));"`
  - expected signal:
    - banner appears with concise remediation text,
    - optional dialog appears with anti-spam actions when flag is enabled.

### 2026-03-04 (v6.3.37)

- Policy-as-code enterprise hardening shipped:
  - strict mode now blocks unsigned runtime policy metadata with deterministic code `POLICY_AS_CODE_UNSIGNED`.
  - lifecycle outputs now expose policy validation metadata in `status --json`, `doctor --json`, and `sdd validate --json`.
  - telemetry/evidence contract now supports policy validation status `unsigned`.
- Traceability:
  - implementation issue: `#606`
  - implementation PR: `#608`
  - tracking sync PR: `#609`
- Consumer quick verification:
  - `npx --yes --package pumuki@latest pumuki status --json`
  - `npx --yes --package pumuki@latest pumuki doctor --json`
  - `PUMUKI_POLICY_STRICT=1 npx --yes --package pumuki@latest pumuki-pre-commit`
  - expected signal:
    - JSON includes `policyValidation.stages.*.validationCode`.
    - strict mode blocks unsigned contracts with `POLICY_AS_CODE_UNSIGNED`.

### 2026-03-04 (v6.3.36)

- SDD orchestration hardening shipped:
  - New enterprise command `pumuki sdd auto-sync` with `--change`, optional `--stage/--task`, `--dry-run`, and `--json`.
  - `auto-sync` orchestrates deterministic docs sync plus learning generation in one step.
  - Fail-safe behavior preserved through the existing transactional `sync-docs` path (no partial writes on conflict).
- Traceability:
  - implementation issue: `#600`
  - implementation PR: `#602`
  - tracking sync PR: `#604`
- Consumer quick verification:
  - `npx --yes --package pumuki@latest pumuki sdd auto-sync --change=rgo-quickstart-02 --stage=PRE_WRITE --task=P12.F2.T70 --dry-run --json`
  - expected signal:
    - `command=pumuki sdd auto-sync` available in CLI help.
    - JSON payload includes `syncDocs.updated` and `learning.path`.

### 2026-03-04 (v6.3.35)

- SDD enterprise incremental hardening shipped:
  - New dedicated command `pumuki sdd learn` with `--change`, optional `--stage/--task`, `--dry-run`, and `--json`.
  - `sync-docs` learning artifact now emits deterministic signal-derived `rule_updates`.
  - Learning payload remains deterministic across missing/invalid/blocked/allowed evidence states.
- Traceability:
  - implementation PRs: `#593`, `#596`, `#599`
- Consumer quick verification:
  - `npx --yes --package pumuki@latest pumuki sdd learn --change=rgo-quickstart-01 --dry-run --json`
  - `npx --yes --package pumuki@latest pumuki sdd sync-docs --change=rgo-quickstart-01 --stage=PRE_WRITE --task=P12.F2.T68 --dry-run --json`
  - expected signal:
    - `command=pumuki sdd learn` available in CLI help.
    - `learning.artifact.rule_updates` populated deterministically when evidence is blocked/invalid.

### 2026-03-04 (v6.3.34)

- Telemetry hardening shipped for long-running enterprise repos:
  - Gate telemetry JSONL supports deterministic size-guard rotation with `PUMUKI_TELEMETRY_JSONL_MAX_BYTES`.
  - Enterprise contract suite now includes profile `telemetry-rotation` to validate JSONL rollover behavior.
- Traceability:
  - implementation PRs: `#574`, `#577`
  - release PR: `#580`
- Consumer quick verification:
  - `npx --yes --package pumuki@latest pumuki doctor --json`
  - `npm run -s validation:contract-suite:enterprise -- --json`
  - `PUMUKI_TELEMETRY_JSONL_PATH=.pumuki/artifacts/gate-telemetry.jsonl PUMUKI_TELEMETRY_JSONL_MAX_BYTES=512 npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json`
  - expected signal:
    - contract suite list includes profile `telemetry-rotation`
    - after repeated validations, files `gate-telemetry.jsonl` and `gate-telemetry.jsonl.1` are present

### 2026-03-04 (v6.3.33)

- Runtime hardening shipped for enterprise diagnosis:
  - `pumuki doctor --deep --json` now includes explicit compatibility contract payload under `deep.contract`.
  - New deep check id `compatibility-contract` validates the active contract for `pumuki/openspec/hooks/adapter`.
- Traceability:
  - implementation PR: `#563`
  - release PR: `#567`
- Consumer quick verification:
  - `npx --yes --package pumuki@latest pumuki doctor --deep --json`
  - expected signal in JSON:
    - `deep.checks` contains an item with `id=compatibility-contract`
    - `deep.contract.overall` resolves to `compatible` or `incompatible` deterministically

## 2026-02 (enterprise-refactor updates)

### 2026-02-27 (v6.3.24)

- Lifecycle loop runner (local deterministic mode):
  - Added `pumuki loop` command surface (`run/status/stop/resume/list/export`).
  - Added session contract + store for deterministic state transitions and persistence.
- Gate integration:
  - `loop run` now executes one strict fail-fast gate attempt on `workingTree`.
  - Per-attempt evidence is emitted to `.pumuki/loop-sessions/<session-id>.attempt-<n>.json`.
- Stability and governance:
  - Fixed time-based flake in waiver enforcement test by using stable future expiry.
  - Synced `VERSION` to package release line.
  - Documentation updated in `README.md` and `docs/product/USAGE.md`.

### 2026-02-27 (v6.3.23)

- README visual rollback to the previous stable style from git history:
  - root hero restored to classic logo image at full width:
    - `<img src="assets/logo.png" alt="Pumuki" width="100%" />`

### 2026-02-27 (v6.3.22)

- README hero render compatibility fix:
  - moved root README hero to PNG banner (`assets/logo_banner.png`) to ensure stable full-width render parity in npm and GitHub viewers.
  - kept wide hero composition and centered logo while avoiding SVG renderer variability.

### 2026-02-27 (v6.3.21)

- README render hardening for npm/GitHub parity:
  - replaced markdown hero image syntax with explicit HTML image tag:
    - `<img src="assets/logo_banner.svg" alt="Pumuki" width="100%" />`

### 2026-02-27 (v6.3.20)

- README visual adjustment:
  - restored full-width hero banner in root `README.md` (`assets/logo_banner.svg`).

### 2026-02-27 (v6.3.19)

- README visual hotfix:
  - restored classic top image in root `README.md` using `assets/logo.png`.
- README collaboration CTA:
  - added a short, friendly "leave a star" reminder at the end of root `README.md`.

### 2026-02-27 (v6.3.18)

- Enterprise documentation baseline refresh:
  - Root `README.md` rewritten with audience segmentation and quick-start-first onboarding.
  - Consumer vs framework-maintainer command surfaces are now explicitly separated.
  - Added collaboration and support/security guidance sections.
- New stable operations policy:
  - `docs/operations/production-operations-policy.md` introduces SaaS production operation baseline:
    - SLO/SLA minimums
    - incident severity and response windows
    - alerting thresholds and mandatory operational controls
    - go-live and rollback requirements
- README walkthrough extraction:
  - detailed menu Option 1 capture narrative moved to `docs/operations/framework-menu-consumer-walkthrough.md`.
  - root README now remains concise while preserving deep visual guidance by reference.
- Command documentation hardening from end-to-end execution audit:
  - fixed legacy parity command argument format to `--legacy=<path> --enterprise=<path>`.
  - documented required flags and expected non-zero verdict semantics for `validation:*` scripts.
  - documented OpenSpec/SDD session prerequisites (`openspec/changes/<change-id>` required before `sdd session --open`).
- Documentation index alignment:
  - `docs/README.md`, `docs/product/USAGE.md`, and `docs/product/INSTALLATION.md` updated to include operations and walkthrough references.

### 2026-02-20 (v6.3.17)

- Evidence and hard-mode state:
  - Added deterministic `repo_state.lifecycle.hard_mode` capture from `.pumuki/hard-mode.json`.
  - Evidence v2.1 now includes normalized hard-mode config path/state for runtime traceability.
- Unified AI Gate hard-mode propagation:
  - `evaluateAiGate` now exposes resolved policy metadata (`stage`, `resolved_stage`, thresholds, trace).
  - `PRE_WRITE` now reports policy resolution deterministically via `PRE_COMMIT` mapping.
- Enterprise MCP contract alignment:
  - `ai_gate_check` now includes policy trace payload in result responses.
  - PRE_WRITE/MCP behavior now matches gate policy resolution used by stage runners.
- Lifecycle + adapter operations:
  - Added `pumuki adapter install --agent=<...> [--dry-run]` and npm alias `adapter:install`.
  - Added adapter templates and runtime scaffolding for `codex`, `claude`, `cursor`, `windsurf`, `opencode`.
- Framework menu UX:
  - Added explicit maintenance action to configure hard-mode enforcement (`id 18`).
- Documentation hardening:
  - Rebuilt `README.md` with enterprise onboarding flow (quickstart, hard mode, PRE_WRITE contract, adapters, MCP references).

### 2026-02-20 (v6.3.16)

- MCP/evidence hardening:
  - `/status` now emits `evidence.exists` as strict boolean in all states.
  - deterministic semantic consolidation preserves suppressed traceability metadata.
- Security/runtime hardening:
  - raised `ts-morph` runtime floor to `>=27.0.2` and removed vulnerable minimatch chain in production audit path.
- Documentation baseline cleanup:
  - normalized active governance references to `PUMUKI.md` (replacing `CLAUDE.md` references in active docs).
  - removed obsolete planning/docs artifacts and duplicated `docs/images/*` mirrors.
- Maintenance surface simplification:
  - removed `validation:docs-hygiene` command path and related framework-menu maintenance action.
  - removed docs-hygiene-only tests/helpers not tied to runtime gate enforcement.

### Documentation governance hardening

- Active docs quality guardrails expanded and integrated into stage-gates:
  - English-only baseline check for active enterprise docs.
  - Markdown reference-integrity check for active docs.
  - Root governance docs (`README.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `PUMUKI.md`) included in active-doc guardrails.
- Stage-gates command simplified to glob-based test targets for maintainability while preserving deterministic coverage.
- Root `CHANGELOG.md` normalized to active enterprise v2 baseline to avoid legacy drift.

### Deterministic gate foundation

- Shared execution flow consolidated in `integrations/git/runPlatformGate.ts`.
- Stage runners unified in `integrations/git/stageRunners.ts`.
- Stage policies standardized in `integrations/gate/stagePolicies.ts`.

### Multi-platform support

- Combined detection and evaluation for `ios`, `backend`, `frontend`, `android`.
- Stage wrappers exported for all supported platforms (`PRE_COMMIT`, `PRE_PUSH`, `CI`).

### Evidence v2.1

- Canonical schema and deterministic write path (`snapshot + ledger`).
- Stable serialization and rule-pack hash traceability.
- `human_intent` preservation + expiry enforcement.

### CI integration

- Reusable gate workflow template plus platform-specific workflows.
- Evidence artifact upload standardized across runs.
- Package-install smoke gate added for published/runtime behavior:
  - workflow: `.github/workflows/pumuki-package-smoke.yml`
  - `block` matrix mode validates expected blocking path (`exit 1`, `outcome=BLOCK`)
  - `minimal` matrix mode validates expected pass path (`exit 0`, `outcome=PASS`)
  - both modes validate evidence v2.1 stage metadata and upload artifacts
- Package manifest guardrail added:
  - command: `npm run validation:package-manifest`
  - enforces required runtime paths in tarball and forbids legacy/tests/archive diagnostics content
- Package manifest guardrail internal hardening:
  - reusable inspection library: `scripts/package-manifest-lib.ts`
  - regression test coverage in stage-gates:
    - `scripts/__tests__/package-manifest-lib.test.ts`
- Framework menu portability hardening:
  - removed host-specific consumer repo path defaults from `scripts/framework-menu.ts`
  - added `PUMUKI_CONSUMER_REPO_PATH` support for environment-specific menu defaults
- Mock consumer validation hardening:
  - new runbook: `docs/validation/mock-consumer-integration-runbook.md`
  - formalized package-smoke + manual mock-consumer A/B checklist
- Phase 5 mock-closure automation:
  - `scripts/build-mock-consumer-startup-triage.ts` generates triage + unblock reports from local package-smoke summaries
  - `validation:phase5-execution-closure` supports `--mock-consumer`
  - mock mode now includes a deterministic mock consumer A/B report step:
    - output: `.audit-reports/phase5/mock-consumer-ab-report.md`
  - mock mode disables external GH preflight/workflow-lint by default and keeps closure flow deterministic
  - local mock execution now reaches:
    - `phase5-blockers-readiness` => `verdict=READY`
    - `phase5-execution-closure-status` => `verdict=READY`
- Mock consumer A/B validation automation:
  - `scripts/build-mock-consumer-ab-report.ts` validates block/minimal smoke outcomes plus evidence v2.1 contract
  - command: `npm run validation:mock-consumer-ab-report -- --repo <owner>/<repo>`
  - output: `.audit-reports/mock-consumer/mock-consumer-ab-report.md`
  - framework menu action:
    - `Build mock consumer A/B validation report`
- Phase5 mock-closure CI hardening:
  - workflow: `.github/workflows/pumuki-phase5-mock.yml`
  - deterministic sequence: package smoke (`block`, `minimal`) -> phase5 mock closure one-shot
  - artifact bundle: `phase5-mock-closure`
  - workflow contract guardrail:
    - `scripts/__tests__/phase5-mock-workflow-contract.test.ts`

### AST heuristics pilot

- Typed heuristic facts extracted in core domain.
- Declarative heuristic rule-pack with optional feature flag.
- iOS force-cast (`as!`) heuristic added to coverage.
- Stage-aware heuristic maturity:
  - `PRE_COMMIT`: heuristic findings remain `WARN`
  - `PRE_PUSH` / `CI`: selected heuristics promoted to `ERROR`

### Documentation cleanup

- Primary and secondary docs rewritten to v2.x model:
  - `README.md`
  - `docs/product/USAGE.md`
  - `docs/product/HOW_IT_WORKS.md`
  - `docs/product/API_REFERENCE.md`

### Hardening and validation updates (latest)

- Evidence consolidation hardened:
  - deterministic file-level collapse across same semantic family, including same-rule multi-line duplicates
  - additive `consolidation.suppressed[]` trace for auditability
- MCP evidence server expanded with compact/full filters:
  - `includeSuppressed=false`
  - `view=compact|full`
- IDE adapter cascade-hook runtime hardening (Adapter baseline):
  - robust Node resolver wrapper
  - optional strict mode `PUMUKI_HOOK_STRICT_NODE=1`
  - explicit diagnostics (`--diagnose`, `PUMUKI_HOOK_DIAGNOSTIC=1`)
  - local diagnostics collector + repeatable local simulation command:
    - `npm run validate:adapter-hooks-local`
  - provider-agnostic alias commands:
    - `npm run validation:adapter-session-status`
    - `npm run validation:adapter-real-session-report`
  - real-session validation checklist:
    - `docs/validation/adapter-hook-runtime-runbook.md`
- Consumer startup diagnostics one-shot orchestrator:
  - `npm run validation:consumer-startup-triage`
- Phase 5 blockers readiness report:
  - `npm run validation:phase5-blockers-readiness`
  - Adapter report is optional by default; use `--require-adapter-report` for strict adapter-mode gating.
  - deterministic verdicts: `READY | BLOCKED | MISSING_INPUTS`
- Phase 5 execution closure status snapshot:
  - `npm run validation:phase5-execution-closure-status`
  - deterministic verdicts: `READY | BLOCKED | MISSING_INPUTS`
  - framework menu action:
    - `Build phase5 execution closure status report`
- Phase 5 execution closure one-shot orchestration:
  - `npm run validation:phase5-execution-closure`
  - executes adapter diagnostics (optional), consumer startup triage, blockers readiness, and closure status in one command
  - includes consumer auth/scope preflight and fail-fast behavior before triage
  - optional bypass: `--skip-auth-preflight`
  - emits deterministic run summary (recommended out-dir): `.audit-reports/phase5/phase5-execution-closure-run-report.md`
  - framework menu action:
    - `Run phase5 execution closure (one-shot orchestration)`
- Phase 5 external handoff report:
  - `npm run validation:phase5-external-handoff`
  - deterministic verdicts: `READY | BLOCKED | MISSING_INPUTS`
  - optional strict flags:
    - `--require-mock-ab-report`
    - `--require-artifact-urls`
  - framework menu action:
    - `Build phase5 external handoff report`
- Adapter-only readiness report:
  - `npm run validation:adapter-readiness`
  - deterministic verdicts: `READY | BLOCKED | PENDING`
- IDE-agnostic gate boundary hardening:
  - runtime boundary test in `integrations/git/__tests__/ideAgnosticBoundary.test.ts`
  - explicit architecture/docs contract that IDE diagnostics remain optional adapters
- Compatibility command hardening:
  - legacy provider-named hook scripts now delegate to adapter-native scripts in `package.json`
  - regression guardrail:
    - `scripts/__tests__/adapter-script-aliases.test.ts`
- Provider-agnostic legacy ruleset resolution:
  - `integrations/git/resolveLegacyRulesetFile.ts`
  - discovers legacy tooling rule directories without provider-specific hardcoding
  - regression guardrail:
    - `integrations/git/__tests__/resolveLegacyRulesetFile.test.ts`
- Validation runbooks index:
  - `docs/validation/README.md`
- Validation artifact hygiene helper:
  - `npm run validation:clean-artifacts` (`--dry-run` supported)
  - cleans local generated `docs/validation/**/artifacts` directories and `.audit_tmp`
  - framework menu action:
    - `Clean local validation artifacts`
## Notes

- Legacy 5.3.4 migration/release notes were removed from active docs to avoid drift.
- Historical commit trace remains available in Git history.
