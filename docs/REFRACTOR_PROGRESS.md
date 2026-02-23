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
- 🚧 `P-ADHOC-LINES-002` Extender extracción de líneas AST al resto de familias heurísticas (`process/security/browser/fs`) para minimizar anchors por fallback.

## Siguiente paso operativo
- ⏳ Mantener `P-ADHOC-LINES-002` como único trabajo en construcción hasta cierre técnico.
