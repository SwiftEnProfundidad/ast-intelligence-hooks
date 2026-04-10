# Seguimiento — Curso Pumuki (Stack My Architecture)

Iniciativa formativa: quinto curso del ecosistema Stack My Architecture. **No** sustituye el espejo operativo de producto en [`plan-activo-de-trabajo.md`](./plan-activo-de-trabajo.md).

## Leyenda

- ✅ Cerrado
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Regla de uso

- Solo puede existir **una** tarea `🚧` a la vez en este documento.
- Actualizar estados al cerrar fases o al desbloquear dependencias.
- Repos objetivo: `stack-my-architecture-pumuki` (curso), `stack-my-architecture-hub` (publicación), enlaces en `stack-my-architecture-governance` y `stack-my-architecture-SDD`.
- Producto de referencia: repo `ast-intelligence-hooks` (paquete npm `pumuki`). Documentación canónica: `README.md`, `docs/product/USAGE.md`, `docs/product/INSTALLATION.md`.

## Contexto

- **Objetivo:** curso dedicado a Pumuki como capa de enforcement (`Facts → Rules → Gate → evidencia v2.1`) en repos reales, sin re-enseñar OpenSpec ni ADR (remite a cursos SDD y Governance).
- **`courseId` propuesto:** `stack-my-architecture-pumuki` (alinear con hub y progress sync).
- **Versión mínima `pumuki` (MVP):** `>= 6.3.71` (ajustar al publicar el curso si hay release posterior).
- **Lab de práctica:** variante o fork de **GovernanceKit** (Governance) o **HelpdeskSDD** (SDD); documentado en `00-preparacion/02-lab-governancekit-helpdesksdd.md` del repo del curso.

## Estado actual

- **Cierre local y release gate:** `build-hub.sh --mode strict` + smoke runtime en verde.
- **Origen en GitHub:** el repo **`stack-my-architecture-hub`** tiene en **`main`** la carpeta estática **`pumuki/`** y el pipeline `build-hub` que la genera (sincronizado con remoto; despliegue a producción con el workflow cuando toque).
- **Repo Pumuki (ramas):** la documentación del curso en este repositorio está integrada en **`develop`** (**PR #746**, merge `428f10d`). La rama **`main`** del producto va **muy por detrás** de `develop` (del orden de **~600** commits a fecha de integración del plan); promover `develop` → `main` es un **release de producto** aparte, no parte del cierre de este plan formativo.
- **GitHub Actions:** si el workflow **Hub Production Release Gate** no arranca el job (p. ej. anotación *billing* / cuenta bloqueada para Actions), el gate en CI queda **bloqueado hasta** regularizar facturación o permisos en GitHub; la publicación sigue pudiendo hacerse **en local** con `./scripts/publish-architecture-stack.sh` en el repo del hub (Vercel CLI + mismos scripts).
- **Publicación Vercel:** deploy del proyecto `stack-my-architecture-hub` con verificación de rutas contra el alias **`https://stack-my-architecture-hub.vercel.app`** (incluye `/pumuki/` → 200). El script `publish-architecture-stack.sh` infiere la base de comprobación desde la línea `Aliased:` del output de Vercel (o `SMA_PUBLISH_VERIFY_BASE_URL`) y escribe **`.runtime/publish-verify-base.url`** para que el workflow **Hub Production Release Gate** ejecute `post-deploy-checks.sh` contra la misma base que pasó la verificación de rutas.
- Si **`https://architecture-stack.vercel.app`** debe exponer el mismo árbol estático que el hub, sincroniza proyecto/CNAME según tu setup (nota emitida por el script al publicar).

## Prioridad ordenada (fases y tareas)

| Fase | Task | Estado | Notas |
|------|------|--------|--------|
| 0 | Crear repo `stack-my-architecture-pumuki` + README + estructura carpetas | ✅ | Repo bajo `stack-my-architecture/stack-my-architecture-pumuki` |
| 0 | Definir `courseId` y versión mínima `pumuki` | ✅ | `stack-my-architecture-pumuki`, `>= 6.3.71` |
| 0 | Elegir proyecto lab (GovernanceKit vs HelpdeskSDD) | ✅ | Documentado en preparación del curso |
| 1 | Redactar roadmap semanal/módulos (`01-roadmap/`) | ✅ | |
| 1 | Módulos 1–7 MVP (lecciones + enlaces USAGE/README Pumuki) | ✅ | `02-modulos/` + referencias npm/docs producto |
| 2 | Integración hub: ruta `/pumuki` + `build-hub.sh` + launcher | ✅ | `stack-hub --course pumuki`, assets desde ios parcheados |
| 2 | Assistant `courseId` + smoke | ✅ | `_hub-platform.js`, `hub-app.js`, README hub + ejemplo curl |
| 3 | Enlaces desde Governance y SDD | ✅ | Semana 8 checkpoint + SDD semana 8 |
| 3 | (Opcional) Anexo iOS/Android Arquitecto/Maestría | ✅ | `00-core-mobile/04-calidad-pr-ready.md` iOS y Android |
| 4 | Scripts validación curso + primera publicación | ✅ | Curso: validate + check-links; hub: publish strict + `/pumuki/` 200 en alias hub |

## Criterios de cierre por fase

- **Fase 0:** repo clonable, README con prerequisitos y convenciones, scripts mínimos ejecutables.
- **Fase 1:** siete módulos enlazados a docs oficiales Pumuki; roadmap con orden de lectura.
- **Fase 2:** `build-hub` genera ruta servible; `stack-hub --course pumuki` documentado.
- **Fase 3:** enlaces mergeados en repos Governance y SDD (y opcional iOS/Android).
- **Fase 4:** checklist publicación + versión `pumuki` fijada en lecciones y CHANGELOG del curso.

## Auditoría y release (Fase 4)

- Ejecutar en el repo del curso: `scripts/validate-course-structure.py`, `scripts/check-links.py`.
- Publicación hub: modo `strict` en `Hub Production Release Gate`; verificación de rutas incluye `/pumuki/` en `publish-architecture-stack.sh`.
- Tras cada release npm relevante de Pumuki, revisar versión mínima en `00-preparacion/` y en este plan.
