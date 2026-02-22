# Menu UI/UX Modernization Cycle

Plan operativo unico para modernizar UI/UX del menu de Pumuki (Consumer + Advanced) sin perder funcionalidad existente.

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

## Objetivo del ciclo
Modernizar la experiencia CLI del menu (Consumer + Advanced) con una UX clara, visualmente consistente y orientada a accion, manteniendo paridad funcional y despliegue seguro por feature flag.

## Fase 1 — Base visual y contratos de UI
- ✅ F1.T1 Definir design tokens CLI (paleta semantica, contraste, fallback no-color, ancho dinamico).
- ✅ F1.T2 Definir componentes de render reutilizables (`Panel`, `Badge`, `SectionHeader`, `MetricRow`, `ActionRow`, `HintBlock`).
- ✅ F1.T3 Definir layout canónico para Consumer y Advanced (jerarquia visual y orden de bloques).
- ✅ F1.T4 Definir reglas de legibilidad terminal (wrapping, truncado, densidad y espaciado).

## Fase 2 — Consumer menu UX moderna
- ✅ F2.T1 Reestructurar visualmente opciones consumer por flujos (auditar, diagnosticar, exportar, salir).
- ✅ F2.T2 Mejorar señalizacion de estado (`PASS/WARN/BLOCK`) con indicadores consistentes.
- ✅ F2.T3 Mantener mensajes operativos de `scope vacio` vs `repo limpio` con mejor claridad UX.
- ✅ F2.T4 Mantener IDs/comportamiento de opciones existentes (sin regresion funcional).

## Fase 3 — Advanced menu UX moderna
- ✅ F3.T1 Aplicar mismo lenguaje visual moderno del consumer.
- ✅ F3.T2 Agrupar acciones advanced por dominios (Gates, Diagnostics, Maintenance, Validation, Exit).
- ✅ F3.T3 Añadir ayuda contextual corta por opcion sin ruido.
- ✅ F3.T4 Mantener compatibilidad de acciones y wiring existentes.

## Fase 4 — Reporte de auditoria moderno
- ✅ F4.T1 Modernizar render del reporte legacy conservando contenido funcional.
- ✅ F4.T2 Mostrar siempre matriz por plataforma (`iOS`, `Android`, `Backend`, `Frontend`, `Other`) aunque esten a cero.
- ✅ F4.T3 Mejorar bloque de metricas, top violaciones y recomendaciones accionables.
- ✅ F4.T4 Asegurar salida robusta en anchos pequeños/medios/grandes.

## Fase 5 — Feature flag y fallback seguro
- ✅ F5.T1 Implementar `PUMUKI_MENU_UI_V2=1|0` (default inicial `0`).
- ✅ F5.T2 Implementar fallback automatico a renderer actual ante error de v2.
- ✅ F5.T3 Mantener compatibilidad con `PUMUKI_MENU_COLOR`, `PUMUKI_MENU_WIDTH`, `PUMUKI_MENU_MODE`.
- ✅ F5.T4 Validar degradacion controlada en terminales sin color/Unicode.

## Fase 6 — TDD completo del ciclo
- ✅ F6.T1 RED/GREEN/REFACTOR de render components y formato de paneles.
- ✅ F6.T2 RED/GREEN/REFACTOR de runtime consumer/advanced (navegacion, opciones, ayudas).
- ✅ F6.T3 RED/GREEN/REFACTOR de reportes (matriz plataformas, severidades, diagnosticos).
- ✅ F6.T4 RED/GREEN/REFACTOR de feature flag/fallback.
- ✅ F6.T5 Ejecutar matriz happy/sad/edge para asegurar no-regresion UX/funcional.

## Fase 7 — Documentacion y cierre
- ✅ F7.T1 Actualizar `README.md` con nuevo flujo UI/UX y flags.
- ✅ F7.T2 Actualizar `docs/USAGE.md` y `docs/API_REFERENCE.md` con nuevos comportamientos de menu.
- ✅ F7.T3 Actualizar `docs/REFRACTOR_PROGRESS.md` y dejar cierre del ciclo documentado.
- ✅ F7.T4 Cierre Git Flow end-to-end (incluye hotfix de runtime detectado en verificacion final).

## Politica de despliegue del ciclo
- Estrategia: `Feature flag`.
- Activacion inicial por defecto: `OFF` (estable actual).
- Activacion controlada: `PUMUKI_MENU_UI_V2=1`.
- Fuera de alcance en este ciclo: cambios de logica de negocio del gate (solo UX/presentacion/ergonomia).

## Continuidad de ciclos
- Este ciclo permanece `CERRADO`.
- La continuidad activa pasa a `docs/RULES_ENGINE_UNIFICATION_CYCLE.md`.
