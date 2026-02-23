# Skills Engine Forensic Recovery Cycle

Plan operativo para recuperar el motor de skills con analisis forense previo, eliminacion de regresiones y contrato enterprise estable.

Estado del plan: `CERRADO`

## Leyenda
- ✅ Hecho
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Reglas de seguimiento
- Este es el unico MD de plan activo para este ciclo.
- Solo puede haber una tarea en `🚧`.
- Cada tarea cerrada pasa a `✅` y se activa la siguiente `🚧`.
- Nomenclatura obligatoria: `F{fase}.T{n}`.
- Rama del ciclo: `feature/skills-engine-forensic-recovery`.
- Cierre esperado del ciclo: Git Flow end-to-end (`feature -> develop -> main`).

## Objetivo del ciclo
Restaurar el comportamiento enterprise del motor para que audite skills sin caja negra, con trazabilidad por stage, severidad canónica y sin reglas `AUTO` no soportadas.

## Fase 0 - Arranque y gobernanza documental
- ✅ F0.T1 Crear este plan en `docs/SKILLS_ENGINE_FORENSIC_RECOVERY_CYCLE.md`.
- ✅ F0.T2 Sincronizar `docs/REFRACTOR_PROGRESS.md` con ciclo activo y una sola tarea en `🚧`.
- ✅ F0.T3 Crear rama del ciclo `feature/skills-engine-forensic-recovery`.

## Fase 1 - Forense de impacto y contrato de ejecucion
- ✅ F1.T1 RCA tecnico completado con informe forense en `docs/SKILLS_ENGINE_FORENSIC_RCA_REPORT.md`.
- ✅ F1.T2 Definir contrato dual `audit-engine` (diagnostico completo) vs `audit-gate` (enforcement SDD estricto).
- ✅ F1.T3 Alinear diagnostico por stage para reflejar el mismo motor que gate/menu.

## Fase 2 - Cierre de brecha AUTO y reglas ejecutables
- ✅ F2.T1 Endurecer compilacion de skills para evitar generar reglas `AUTO` sin detector.
- ✅ F2.T2 Consolidar catalogo de reglas core ejecutables (incluye SOLID/Clean/God Class).
- ✅ F2.T3 Garantizar `unsupported_auto_rule_ids=0` en `PRE_WRITE/PRE_COMMIT/PRE_PUSH/CI` (`scope=repo`).

## Fase 3 - Contratos de evidencia y severidad enterprise
- ✅ F3.T1 Introducir `audit_mode` en evidencia (`engine|gate`) con trazabilidad SDD explicita.
- ✅ F3.T2 Añadir resumen de severidad enterprise (`CRITICAL/HIGH/MEDIUM/LOW`) sin romper compatibilidad.
- ✅ F3.T3 Homologar salida visual/menu/reportes para usar severidad enterprise canónica.

## Fase 4 - TDD integral y verificacion funcional/visual
- ✅ F4.T1 RED/GREEN/REFACTOR en config/gate/evidence/menu para los cambios anteriores.
- ✅ F4.T2 Matriz runtime por stage y modo (`engine|gate`) con evidencia determinista.
- ✅ F4.T3 Verificacion visual del menu y reportes tras la unificacion.

## Fase 5 - Cierre de ciclo
- ✅ F5.T1 Actualizar documentacion (`README`, `USAGE`, `API_REFERENCE`, `evidence-v2.1`).
- ✅ F5.T2 Generar informe final de cumplimiento con resultados reproducibles.
- ✅ F5.T3 Cierre Git Flow end-to-end (PR a `develop`, merge, sync `develop -> main`).
