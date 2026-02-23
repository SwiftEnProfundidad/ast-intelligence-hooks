# Enterprise AST Detection Superiority Cycle

Plan operativo unico para llevar Pumuki a deteccion enterprise de violaciones superando siempre a legacy y aplicando TODAS las skills sin excepcion.

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
- Rama del ciclo: `feature/enterprise-ast-detection-superiority`.
- Cierre esperado del ciclo: Git Flow end-to-end (`feature -> develop -> main`).

## Objetivo del ciclo
Garantizar que Pumuki aplique siempre TODAS las skills (core + custom de developer), con detectores ejecutables por regla, enforcement SDD estricto en todos los flujos y evidencia de cobertura por fichero/plataforma/stage, superando de forma estricta el baseline legacy.

## Fase 0 - Arranque de ciclo y control documental
- ✅ F0.T1 Crear este plan `docs/ENTERPRISE_AST_DETECTION_SUPERIORITY_CYCLE.md` con fases/tareas/leyenda oficial.
- ✅ F0.T2 Sincronizar `docs/REFRACTOR_PROGRESS.md` dejando este ciclo como activo y una sola tarea en construccion.
- ✅ F0.T3 Crear rama del ciclo `feature/enterprise-ast-detection-superiority`.

## Fase 1 - Skills ejecutables 100% (sin caja negra)
- ✅ F1.T1 Introducir registro central de detectores (`ruleId -> detector`) para skills `AUTO`.
- ✅ F1.T2 Eliminar fallback declarativo silencioso para skills importadas/no canonicas.
- ✅ F1.T3 Bloquear gate cuando exista cualquier skill `AUTO` sin detector mapeado.
- ✅ F1.T4 Añadir trazabilidad en evidencia de reglas activas/evaluadas/no soportadas por detector.

## Fase 2 - SDD estricto y coherente en todos los flujos
- ✅ F2.T1 Eliminar bypass SDD del menu de auditoria para alinear con hooks/runtime.
- ✅ F2.T2 Integrar SDD como capa visible de trazabilidad en diagnosticos de cobertura.
- ✅ F2.T3 Asegurar contrato estricto de `PRE_WRITE` dentro de la matriz operativa visible.

## Fase 3 - Skills del developer desde menu interactivo
- ✅ F3.T1 Endurecer import de skills custom para que toda regla nueva nazca ejecutable (`AUTO`) o bloquee.
- ✅ F3.T2 Verificar en menu y diagnosticos que el merge `core + custom` queda trazado de forma explicita.
- ✅ F3.T3 Añadir pruebas de regresion para carga de skills externas por repo/entorno.

## Fase 4 - Paridad superior sobre legacy
- ✅ F4.T1 Crear harness de comparacion `legacy vs enterprise` por regla/plataforma.
- ✅ F4.T2 Imponer criterio de dominancia estricta (`enterprise >= legacy`) en suites de validacion.
- ✅ F4.T3 Emitir reporte determinista de superioridad para auditoria full repo.

## Fase 5 - TDD integral, verificacion visual/funcional y cierre
- ✅ F5.T1 Completar TDD RED/GREEN/REFACTOR de los cambios del motor.
- ✅ F5.T2 Ejecutar validacion funcional (gate, menu, evidencia, stages) y revisar salida visual.
- ✅ F5.T3 Actualizar documentacion de uso/arquitectura/contratos.
- ✅ F5.T4 Cierre Git Flow end-to-end (PR `#350` a `develop`, merge, sync `develop -> main` con PR `#351`).

## Cierre del ciclo
- ✅ Objetivo cumplido: enforcement ejecutable de skills `AUTO`, SDD estricto visible por stage y trazabilidad de cobertura con reglas no soportadas.
- ✅ Dominancia sobre baseline legacy documentada en `docs/LEGACY_PARITY_REPORT.md`.
- ✅ Flujo Git completado: `feature -> develop -> main`.
