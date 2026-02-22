# Rules Engine Unification Cycle

Plan operativo unico para unificar el motor de reglas de Pumuki con cobertura total de reglas core + overrides custom por repo.

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
- Rama del ciclo: `feature/rules-engine-unification`.
- Cierre esperado del ciclo: Git Flow end-to-end (`feature -> develop -> main`).

## Objetivo del ciclo
Garantizar que Pumuki aplique siempre TODAS las reglas core del producto (sin dependencia externa en runtime) y permita overrides custom por repo (`custom > core`) con trazabilidad completa por stage/plataforma.

## Fase 0 — Arranque de ciclo y baseline documental
- ✅ F0.T1 Crear este plan `docs/RULES_ENGINE_UNIFICATION_CYCLE.md` con estructura oficial del ciclo.
- ✅ F0.T2 Cerrar ciclos anteriores relevantes y dejar este como ciclo operativo activo.
- ✅ F0.T3 Actualizar tracker `docs/REFRACTOR_PROGRESS.md` con estado del ciclo y siguiente tarea.

## Fase 1 — Core ruleset embebido
- ✅ F1.T1 Definir snapshot interno versionado de reglas core (`CoreRulesSnapshot`) como fuente primaria runtime.
- ✅ F1.T2 Integrar compilacion de reglas desde skills sincronizadas y persistencia determinista de hash.
- ✅ F1.T3 Reenrutar carga del motor a ruleset efectivo (`core + repo lock + custom local`).
- ✅ F1.T4 Garantizar fallback seguro de compatibilidad en ausencia de locks locales.

## Fase 2 — Cobertura total por plataforma detectada
- ✅ F2.T1 Activar reglas por plataforma detectada (`ios/android/backend/frontend`) sin pérdidas.
- ✅ F2.T2 Clasificar reglas en `AUTO` y `DECLARATIVE` para cobertura completa sin falsos vacíos.
- ✅ F2.T3 Forzar trazabilidad de cobertura en evidencia (`active/evaluated/matched/unevaluated`) por stage.
- ✅ F2.T4 Mantener bloqueo de gobernanza con mensaje accionable cuando coverage sea incompleta.

## Fase 3 — Overrides custom por repo
- ✅ F3.T1 Definir formato local `/.pumuki/custom-rules.json`.
- ✅ F3.T2 Implementar import de reglas desde `AGENTS.md`, `SKILLS.md` y rutas `SKILL.md`.
- ✅ F3.T3 Aplicar política de conflicto `custom sobrescribe core` con trazabilidad explícita.
- ✅ F3.T4 Exponer ruleset efectivo para auditoría y diagnósticos.

## Fase 4 — Menú interactivo y comandos
- ✅ F4.T1 Añadir opción de menú para importar reglas custom.
- ✅ F4.T2 Añadir runners/builders para importación y validación de custom rules.
- ✅ F4.T3 Reflejar en vistas (consumer/advanced) el estado de bundles activos y custom import.

## Fase 5 — TDD y validación funcional
- ✅ F5.T1 Tests de compilación/lock con reglas extraídas desde markdown de skills.
- ✅ F5.T2 Tests de `skillsRuleSet` con plataformas detectadas y reglas declarativas.
- ✅ F5.T3 Tests de import custom + precedencia `custom > core`.
- ✅ F5.T4 Validación visual y funcional del menú y flujos de auditoría.

## Fase 6 — Documentación y cierre Git Flow
- ✅ F6.T1 Actualizar `README.md` con arquitectura core rules + custom per repo.
- ✅ F6.T2 Actualizar `docs/USAGE.md` y `docs/API_REFERENCE.md`.
- ✅ F6.T3 Actualizar `docs/evidence-v2.1.md` con nuevos campos de cobertura/origen.
- ✅ F6.T4 Cierre Git Flow end-to-end: PR a `develop`, merge, sync `develop -> main`.

## Política cerrada del ciclo
- Core rules siempre activas por plataforma detectada.
- Runtime sin dependencia de fuentes externas.
- Overrides custom solo locales por repo.
- Política de conflictos: `custom > core`.
- Evidencia obligatoria y determinista para cobertura de reglas.
- Ciclo cerrado con merge completado en `develop` y `main`.
