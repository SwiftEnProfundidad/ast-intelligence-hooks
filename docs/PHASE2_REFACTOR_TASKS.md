# Plan de Refactor — Seguimiento de Tareas

Fecha de inicio: 2026-02-15
Rama de trabajo: `feature/refactor-fs-syncpart3-split`

## Leyenda

- ✅ Completada
- 🚧 En progreso
- ⏳ Pendiente

## Fase 1 — Crítico (bloquea release)

- ✅ Particionar `integrations/mcp/evidenceFacetsSuppressed.ts` por dominio de facetas sin cambiar comportamiento.
- ✅ Ajustar imports/exportaciones en el módulo de facetas suprimidas para consumir/reexportar los nuevos submódulos sin romper API pública.
- ✅ Mantener compatibilidad de tipos y contratos MCP (`ConsolidationSuppressedFinding`, facetas derivadas).

## Fase 2 — Alto (mejora calidad)

- ✅ Reducir tamaño del módulo principal objetivo a submódulos cohesionados y legibles.
- ✅ Añadir pruebas unitarias específicas para facetas suprimidas críticas (conteos, agrupaciones, ratios).
- ✅ Eliminar helpers duplicados o acoplamientos innecesarios detectados durante la extracción.

## Fase 3 — Medio (deuda técnica)

- ✅ Revisar naming y estructura de carpetas de facetas para trazabilidad y mantenimiento.
- ✅ Documentar brevemente el mapa de facetas suprimidas y ownership de cada módulo.

## Fase 4 — Operativa Git Flow

- ✅ Sincronizar `main` local con `origin/main` por fast-forward tras merge de PRs.
- ✅ Eliminar ramas `feature/*` cerradas (local/remoto) sin pérdida de datos.
- ✅ Crear siguiente rama `feature/refactor-evidence-payloads-split` para continuar fase alta.
- ✅ Particionar `integrations/mcp/evidencePayloads.ts` en submódulos por contexto sin romper contratos MCP.
- ✅ Particionar `integrations/mcp/evidencePayloadSummary.ts` en submódulos por contexto sin romper contratos MCP.
- ✅ Extraer utilitarios de ordenado/plataforma de `integrations/mcp/evidencePayloadCollections.ts` a `evidencePayloadCollectionsSorters.ts`.
- ✅ Extraer bloque de filtros/paginación de `integrations/mcp/evidencePayloadCollections.ts` en helpers reutilizables (`evidencePayloadCollectionsPaging.ts`).
- ✅ Extraer handler `rulesets` a `integrations/mcp/evidencePayloadCollectionsRulesets.ts` con reexport estable.
- ✅ Extraer handler `platforms` a `integrations/mcp/evidencePayloadCollectionsPlatforms.ts` con reexport estable.
- ✅ Extraer handlers `ledger` a `integrations/mcp/evidencePayloadCollectionsLedger.ts` con reexport estable.
- ✅ Extraer handler `findings` a `integrations/mcp/evidencePayloadCollectionsFindings.ts` con reexport estable.
- ✅ Revisar y estabilizar barrel final de `evidencePayloadCollections.ts` (solo reexports + snapshot/response).
- ✅ Publicar `feature/refactor-evidence-payloads-split` y abrir PR contra `develop` para integración.
- ✅ Mergear PR `#306` en `develop`.
- ✅ Sincronizar worktree sin pérdida y limpiar rama feature (`feature/refactor-evidence-payloads-split`) local/remota.
- ✅ Preparar siguiente rama feature del plan de refactor sobre base `develop` para el próximo bloque (`feature/refactor-run-platform-gate-decouple`).
- ✅ Reducir acoplamiento en `integrations/git/runPlatformGate.ts` con extracción de evaluación/reglas a `runPlatformGateEvaluation.ts`.
- ✅ Extraer resolución de facts por scope en `runPlatformGate` a `runPlatformGateFacts.ts` sin romper contratos.
- ✅ Extraer bloque de emisión de evidencia a `runPlatformGateEvidence.ts` para seguir reduciendo acoplamiento en `runPlatformGate`.
- ✅ Revisar y estabilizar orquestación final de `runPlatformGate.ts` (imports/dependencias mínimas) antes de publicar rama.
- ✅ Publicar `feature/refactor-run-platform-gate-decouple` y abrir PR contra `develop` para integración.
- ✅ Verificar checks/mergeabilidad del PR `#307` y preparar merge a `develop`.
- ✅ Mergear PR `#307` en `develop` manteniendo historial sin pérdida.
- ✅ Sincronizar worktree con `develop` sin pérdida (alineado a `origin/develop` por restricción de worktree).
- ✅ Limpiar rama `feature/refactor-run-platform-gate-decouple` local/remota sin pérdida.
- ✅ Crear siguiente rama feature del plan (`feature/refactor-fs-sync-split`) sobre `develop` para continuar reducción de módulos largos.
- ✅ Extraer detectores de permisos/ownership de `syncPart2` a `syncPart2Permissions.ts` con reexport estable.
- ✅ Extraer categoría de `syncPart2` (I/O vectorizado/escritura) a `syncPart2Io.ts` con reexport estable.
- ✅ Extraer categoría restante de `syncPart2` (truncado/timestamps) a `syncPart2Times.ts` con reexport estable.
- ✅ Revisar cierre de partición en `syncPart2` (núcleo residual + reexports) con `syncPart2Core.ts` y barrel final.
- ✅ Publicar `feature/refactor-fs-sync-split` en remoto.
- ✅ Abrir PR de `feature/refactor-fs-sync-split` contra `develop` para integración (`#308`).
- ✅ Verificar checks/mergeabilidad del PR `#308` y preparar merge a `develop`.
- ✅ Mergear PR `#308` en `develop` manteniendo historial sin pérdida.
- ✅ Sincronizar worktree con `develop` sin pérdida (alineado a `origin/develop` tras merge de `#308`).
- ✅ Limpiar rama `feature/refactor-fs-sync-split` local/remota sin pérdida.
- ✅ Crear siguiente rama feature del plan (`feature/refactor-fs-syncpart1-split`) sobre `develop` para continuar reducción en detectores fs.
- ✅ Extraer categoría metadata/estado de `syncPart1` a `syncPart1Metadata.ts` con reexport estable.
- ✅ Extraer operaciones de archivo de `syncPart1` a `syncPart1FileOps.ts` con reexport estable.
- ✅ Extraer categoría residual de `syncPart1` (directorio + `utimes`) a `syncPart1DirTimes.ts` con reexport estable.
- ✅ Publicar `feature/refactor-fs-syncpart1-split` en remoto.
- ✅ Abrir PR de `feature/refactor-fs-syncpart1-split` contra `develop` para integración (`#309`).
- ✅ Verificar checks/mergeabilidad del PR `#309` y preparar merge a `develop`.
- ✅ Mergear PR `#309` en `develop` manteniendo historial sin pérdida.
- ✅ Sincronizar worktree con `develop` sin pérdida (alineado a `origin/develop` tras merge de `#309`).
- ✅ Limpiar rama `feature/refactor-fs-syncpart1-split` local/remota sin pérdida.
- ✅ Crear siguiente rama feature del plan (`feature/refactor-fs-syncpart3-split`) sobre `develop` para continuar reducción en detectores fs.
- ✅ Extraer categoría de enlaces de `syncPart3` a `syncPart3Links.ts` con reexport estable.
- ✅ Extraer categoría descriptor I/O de `syncPart3` a `syncPart3DescriptorIo.ts` con reexport estable.
- ✅ Extraer categoría residual de `syncPart3` (cp/open/opendir/mkdtemp/appendFile) a `syncPart3PathOps.ts` y cerrar `syncPart3.ts` como barrel.
- ✅ Publicar `feature/refactor-fs-syncpart3-split` en remoto.
- ✅ Abrir PR de `feature/refactor-fs-syncpart3-split` contra `develop` para integración (`#310`).
- ✅ Verificar checks/mergeabilidad del PR `#310` y preparar merge a `develop` (bloqueado: estado `UNSTABLE` por checks fallidos).
- ✅ Analizar fallos de checks del PR `#310` y definir corrección mínima para desbloquear merge (causa raíz: GitHub Actions bloqueado por `billing issue`, jobs no iniciados).
- ✅ Relanzar checks del PR `#310` (reintentos ejecutados; los jobs siguen bloqueados por `billing issue`).
- ✅ Revalidar estado de mergeabilidad/checks del PR `#310` tras reintentos (sigue `UNSTABLE` por `billing issue` externo).
- ✅ Escalar bloqueo externo en PR `#310` con comentario de evidencia y acción requerida (issuecomment `#3904728161`).
- ✅ Intentar activar `auto-merge` en PR `#310` (bloqueado: el repositorio no tiene `auto-merge` habilitado).
- ✅ Etiquetar PR `#310` como `blocked` para trazabilidad operativa del bloqueo externo.
- ✅ Monitorizar estado del PR `#310` vía MCP (sin desbloqueo detectado durante ventana de observación).
- ✅ Reabrir PR `#310` y ejecutar merge administrativo en `develop` por decisión explícita del usuario (aceptando CI bloqueado por billing).
- ✅ Sincronizar este worktree a `origin/develop` sin pérdida (HEAD detached en commit de merge `115890a`).
- ✅ Limpiar rama `feature/refactor-fs-syncpart3-split` remota/local sin pérdida y conservar respaldo en `archive/refactor-fs-syncpart3-split-2026-02-15`.
- ✅ Preparar siguiente rama feature del plan desde `origin/develop` (rama creada: `feature/refactor-evidence-facets-split`).
- 🚧 Corregir configuración de Jest para ejecutar tanto `*.test.ts` como `*.spec.ts` desde `npm test`.

## Fase 5 — Pruebas (operativa)

- ✅ Ajustar `jest.config.js` para incluir `*.test.ts` en `testMatch`.
- ⚠️ En `feature/validate-jest-config`: ejecutar `npm test --passWithNoTests` falló.
  - Hallazgo: se ejecutan suites `*.test.ts` que no contienen tests jest (`node:test`), provocando `Your test suite must contain at least one test`.
  - También aparecieron regresiones documentales existentes (`docs-markdown-reference-integrity`, `enterprise-docs-language`, `enterprise-docs-agnostic`, `root-docs-baseline`, `consumer-support-bundle-gh-command`).

## Notas de ejecución

- Seguimiento interno local: no se sube al repositorio.
- Commits atómicos: una tarea funcional por commit.
- Al cerrar una tarea: marcar `✅` y mover la siguiente a `🚧`.
