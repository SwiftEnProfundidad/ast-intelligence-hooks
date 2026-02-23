# Refactor Progress Tracker

Estado operativo activo del repositorio.

## Leyenda
- ✅ Hecho
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Estado actual
- ✅ `HYG.T1` Inventario completo de markdowns, artefactos y carpetas huérfanas.
- ✅ `HYG.T2` Unificación documental oficial creada: `docs/validation/detection-audit-baseline.md`.
- ✅ `HYG.T3` Limpieza aplicada:
  - eliminados ciclos/reportes forenses obsoletos del root de `docs/`
  - eliminados artefactos forenses de `assets/readme/forensics-violations/*`
  - eliminada documentación no oficial de raíz (`CLAUDE.md`)
  - eliminadas carpetas huérfanas vacías (`apps/*`, `assets/readme/menu-option1-notification-proof/*`)
- ✅ `HYG.T4` Verificación final de higiene enterprise:
  - referencias rotas críticas: `0`
  - compilación TypeScript: `OK` (`npm run typecheck`)
  - inventario de `.md` normalizado y sin reportes/ciclos forenses en `docs/` root
- ✅ `P-ADHOC-LINES-002` Extender extracción de líneas AST al resto de familias heurísticas (`process/security/browser/fs`) para minimizar anchors por fallback.
  - detectores `process/security/browser` con `find*Lines` y pruebas dedicadas
  - autolocalización de líneas AST por convención `has*/find*Lines`
  - inferencia para familia `fs` (`sync/promises/callbacks`) sin hardcode por regla
  - validación: tests heurísticos focales `OK` + `npm run typecheck` `OK`
- ✅ `P-ADHOC-LINES-003` Verificar trazabilidad clicable end-to-end en menú/reportes usando `lines` de todas las familias AST.
  - salida de bloqueo en gate (`runPlatformGateOutput`) enriquecida con `severity + ruleId + message + file:line`
  - `exportLegacyAuditMarkdown` ahora incluye secciones markdown con rutas clicables `./path#Lline`
  - cobertura de tests para salida clicable y export markdown
  - validación: tests focales `OK` + `npm run typecheck` `OK`
- ✅ `P-ADHOC-LINES-004` Ejecutar smoke e2e de trazabilidad (`pre-write`, `pre-commit`, `pre-push`, menú opción 1/8/9) y registrar evidencias finales.
  - tests runtime menú para opción `9` (diagnóstico clicable) y opción `8` (export markdown clicable)
  - tests de salida gate (`runPlatformGateOutput`) con `lines` array/string/sin líneas
  - validación: suite focal `OK` (29 tests) + `npm run typecheck` `OK`
- ✅ `P-ADHOC-LINES-005` Ejecutar auditoría funcional completa y verificar visualmente trazabilidad clicable en salida real de hooks + menú.
  - hooks reales ejecutados con evidencia en:
    - `.audit_tmp/prewrite-functional.out`
    - `.audit_tmp/precommit-functional.out`
    - `.audit_tmp/prepush-functional.out`
  - validado `file:line` en bloqueos de hooks:
    - `pre-write`: `openspec/changes:1`, `.ai_evidence.json:1`, `.git/HEAD:1`
    - `pre-commit` / `pre-push`: `openspec/changes:1`
  - flujo menú consumer validado en TTY real (`1 -> 8 -> 9 -> 10`) con evidencia en:
    - `.audit_tmp/menu-functional-tty.out`
    - export markdown: `.audit-reports/pumuki-legacy-audit.md`
  - comprobadas secciones clicables en markdown:
    - `## Clickable Top Files`
    - `## Clickable Findings` con enlaces `./path#Lline`
- ✅ `P-ADHOC-LINES-006` Consolidar reporte final de recuperación de detección enterprise (resumen funcional + evidencias clave) para cierre operativo del ciclo.
  - reporte oficial creado en `docs/validation/enterprise-detection-recovery-closure.md`
  - incluye estado consolidado del gate, severidades, cobertura y evidencias de hooks/menú/export markdown
  - `docs/validation/README.md` actualizado para registrar el documento como referencia versionada
- ✅ `P-ADHOC-LINES-007` Preparar cierre Git Flow end-to-end (commit atómico, PR, merge y sincronización) sin pérdida de cambios.
  - rama de trabajo dedicada `feature/p-adhoc-lines-007-gitflow-closure`
  - validación previa de calidad ejecutada (`tsx --test` focal + `npm run typecheck`)
  - lote consolidado para commit atómico del ciclo de recuperación
  - cierre previsto por PR con merge a `develop` y sincronización de ramas protegidas
- 🚧 `P-ADHOC-LINES-008` Ejecutar auditoría full-repo post-cierre y emitir informe final de violaciones por severidad con rutas clicables.

## Siguiente paso operativo
- 🚧 Ejecutar `P-ADHOC-LINES-008` para validar el estado post-cierre con auditoría full-repo.
