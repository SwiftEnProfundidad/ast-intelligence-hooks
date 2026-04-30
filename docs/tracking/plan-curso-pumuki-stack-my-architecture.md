# Diseño pedagógico y seguimiento — Curso Pumuki (Stack My Architecture)

Este documento define **qué debe aprender una persona**, **en qué orden**, **cómo se comprueba** y **qué confusiones hay que romper**. El seguimiento de repos y build va **al final**; no sustituye el diseño.

No sustituye el espejo de producto en [`plan-activo-de-trabajo.md`](./plan-activo-de-trabajo.md).

## Leyenda operativa

- ✅ Entregado en repo curso + coherente con USAGE/INSTALLATION
- 🚧 Única tarea activa (máx. 1)
- ⏳ Pendiente
- ⛔ Bloqueado

---

## 1. Para quién es y qué problema resuelve

**Quién:** desarrollador o tech lead que debe **vivir** con hooks, CI y (a veces) agentes; no auditor de slides.

**Problema:** en la práctica mezcla *SDD*, *gate*, *MCP*, *evidencia* y *menú*; cuando algo bloquea no sabe **qué capa** falló ni **qué comando** la inspecciona.

**Éxito del curso:** tras cerrarlo, en un repo real puede (1) nombrar el **stage** y el **scope** de un fallo, (2) leer **`.ai_evidence.json`** y relacionarlo con stderr, (3) distinguir **enforcement** (hooks/CI) de **lectura/agente** (MCP), (4) ejecutar el **flujo SDD mínimo** sin confundirlo con “arreglar reglas”, (5) instalar, actualizar o **retirar** Pumuki sin dejar hooks huérfanos.

- **Cierre local y release gate:** `build-hub.sh --mode strict` + smoke runtime en verde.
- **Origen en GitHub:** el repo **`stack-my-architecture-hub`** tiene en **`main`** la carpeta estática **`pumuki/`** y el pipeline `build-hub` que la genera (sincronizado con remoto; despliegue a producción con el workflow cuando toque).
- **Repo Pumuki (ramas):** la documentación del curso en este repositorio está integrada en **`develop`** (**PR #746**, merge `428f10d`). La rama **`main`** del producto va **muy por detrás** de `develop` (del orden de **~600** commits a fecha de integración del plan); promover `develop` → `main` es un **release de producto** aparte, no parte del cierre de este plan formativo.
- **GitHub Actions:** la org **no** dispone de cuota útil para Actions → el **Hub Production Release Gate** en CI **no** se usa como gate; publicación y comprobaciones **en local** con `./scripts/publish-architecture-stack.sh` en el repo del hub (Vercel CLI + mismos scripts).
- **Publicación Vercel:** deploy del proyecto `stack-my-architecture-hub` con verificación de rutas contra el alias **`https://stack-my-architecture-hub.vercel.app`** (incluye `/pumuki/` → 200). El script `publish-architecture-stack.sh` infiere la base desde `Aliased:` (o `SMA_PUBLISH_VERIFY_BASE_URL`) y escribe **`.runtime/publish-verify-base.url`** para alinear `post-deploy-checks.sh` con la URL verificada (localmente o cuando Actions vuelva a estar disponible).
- Si **`https://architecture-stack.vercel.app`** debe exponer el mismo árbol estático que el hub, sincroniza proyecto/CNAME según tu setup (nota emitida por el script al publicar).

Si eso no se cumple, el curso falla aunque el HTML sea bonito.

---

## 2. Modelo mental único (todo el curso orbita aquí)

Una sola frase que el alumno debe poder repetir:

**Hechos del diff/código → reglas efectivas → decisión del gate por stage → registro en evidencia v2.1.**

Todo lo demás (menú, MCP, notificaciones, `doctor`) es **acceso** a ese mismo pipeline o **comodidad**; no es un segundo producto.

---

## 3. Confusiones que el material debe desmontar de forma explícita

Cada unidad del curso debe tener al menos un párrafo “**no confundas**” o un mini escenario:

| Confusión típica | Verdad operativa |
|------------------|------------------|
| “Sin MCP no hay Pumuki” | Los **hooks y CI** son el enforcement; MCP es **opcional** para IDE/agente. |
| “SDD es lo mismo que el gate” | SDD/OpenSpec gobierna el **cambio**; el gate evalúa **código + política + evidencia** en un **scope** concreto. |
| “`openspec` en el PATH basta” | Pumuki usa OpenSpec **repo-local** (`node_modules/.bin`). |
| “PRE_COMMIT limpio ⇒ push seguro” | **PRE_PUSH** mira otro **scope** (`upstream..HEAD`). |
| “El menú es la fuente de verdad” | El menú **orquesta** diagnósticos; la fuente de verdad es **policy + stage + evidencia**. |
| “Borrar el paquete limpia el repo” | `npm uninstall pumuki` **no** quita hooks/lifecycle; hace falta **`pumuki remove`** / flujo documentado. |

Si el Markdown del curso no nombra estas líneas, el plan pedagógico sigue vacío aunque haya tablas de check.

---

## 4. Secuencia didáctica (orden de primera lectura)

El repo del curso incluye la **columna vertebral en prosa** `00-preparacion/03-recorrido-cero-a-cien-pumuki.md` (0→100 % sin saltos) y el **proyecto guiado** `02-modulos/13-proyecto-guiado-de-la-a-la-z.md` (fases A–M con criterios de hecho). Esta tabla U0–U10 sigue siendo el contrato de **outcomes**; esas piezas son el **relato** y el **laboratorio** que los materializan.

El **mapa completo** (`00-mapa-completo-del-producto.md`) es **referencia** para quien ya perdió el hilo; la **primera pasada** debe seguir esta secuencia para no cargar conceptos antes de tiempo.

| Orden | Unidad | Objetivo observable (el alumno demuestra…) | Actividad mínima en lab | Criterio de dominio |
|-------|--------|---------------------------------------------|-------------------------|----------------------|
| U0 | Preparación + versión + lab | Que existe documentación canónica y un repo donde ensayar | Abrir USAGE e INSTALLATION; fijar versión mínima `pumuki` | Explica en una frase dónde miente un “funciona en mi máquina” sin `doctor` |
| U1 | Contrato + stages + cobertura | Qué pregunta **cada** stage y qué es `unevaluated_rule_ids` | Un `pre-commit` / `pre-push` y leer evidencia | Predice scope antes de ejecutar y acierta al comparar con JSON |
| U2 | Instalación y primer verde | Postinstall, `bootstrap` vs `install`, `pathExecutionHazard` | `doctor --json` antes/después de un cambio reversible | Usa `alignmentCommand` o workaround sin improvisar |
| U3 | Ciclo de vida completo | Diferencia `npm uninstall`, `pumuki uninstall`, `pumuki remove`, `update --latest` | Simular retirada en rama de prueba | Lista qué queda en disco tras cada comando |
| U4 | Evidencia | Dónde se escribe, cuándo **no** se reescribe (PRE_PUSH trackeado), restage PRE_COMMIT | Diff de `.ai_evidence.json` entre stages | Explica un caso “hook modificó archivo” sin pánico |
| U5 | Menú interactivo | Consumer vs Advanced; 1–4/8/9; matrix; variables UI | Correr `pumuki-framework` y una opción de cada familia | Enlaza opción de menú con **stage** y **scope** equivalentes |
| U6 | MCP | Evidence vs enterprise; HTTP vs stdio; recibo PRE_WRITE | Levantar o inspeccionar config en `.pumuki/adapter.json` | Explica por qué el gate puede pasar con MCP caído |
| U7 | SDD/OpenSpec | Flujo diario: `sdd status`, `session`, `validate`; catálogo de códigos | Abrir sesión de cambio y validar un stage | Clasifica un JSON de bloqueo en “falta OpenSpec” vs “falta sesión” |
| U8 | Notificaciones y watch | macOS vs stderr; `system-notifications.json`; anti-spam de `watch` | Una sesión `watch --once` o documentada | Elige variable correcta para silenciar o espejar |
| U9 | Perfiles, Governance, monorepo | Cuándo bajar de enterprise; prefijos de scope; parity | (Según perfil del equipo) | Justifica un perfil sin autoboicot |
| U10 | Cierre | Checklist operativa propia del equipo | Checklist escrita a partir del curso | Puede enseñar el modelo mental §2 a otra persona en 3 minutos |

**Regla:** ninguna fila U1–U10 puede considerarse “hecha” solo con un enlace a USAGE; debe existir **narrativa + comando + actividad + criterio** en el Markdown del curso.

---

## 5. Qué el curso no debe intentar (límites)

- Sustituir el curso **SDD** (OpenSpec, Kanban del cambio) ni el **Governance** (AGENTS, cultura): solo **enganchar** Pumuki a ellos.
- Sustituir tests de producto, revisión humana ni criterios de negocio.
- Prometer “cero lectura de USAGE”: USAGE sigue siendo norma; el curso debe **enseñar** lo mismo con **menor fricción**, no duplicar mal.

---

## 6. Estado de entrega en el repo (operativo, subordinado al §4)

| Unidad §4 | Estado en `stack-my-architecture-pumuki` |
|-----------|-------------------------------------------|
| U0–U2 | ✅ Base + módulo 2; ciclo de vida **completo** en **08** |
| U3 | ✅ `02-modulos/08-ciclo-de-vida-install-uninstall-actualizacion.md` |
| U4 | ✅ `02-modulos/09-evidencia-por-stage-y-ai-evidence-json.md` |
| U5 | ✅ `02-modulos/10-menu-interactivo-matrix-y-preflight.md` |
| U6 | ✅ `02-modulos/11-mcp-enforcement-vs-lectura-agente.md` |
| U7 | ✅ Módulo **04** ampliado (§4.6–4.8 + criterio dominio) |
| U8 | ✅ `02-modulos/12-notificaciones-macos-stderr-y-watch.md` |
| U9–U10 | ✅ Revisar checklist **07** frente a criterios §4 en próxima iteración |

| Task | Estado |
|------|--------|
| Implementar U3–U8 en `.md` + `FILE_ORDER` + validación | ✅ |
| CHANGELOG curso + rebuild HTML + sync hub local | ✅ (incl. CSS lectura **0.3.1**) |
| Push hub + deploy Vercel (ver curso en prod) | 🚧 |

---

## 7. Auditoría técnica (no confundir con evaluación del alumno)

- `python3 scripts/validate-course-structure.py` y `check-links.py` en repo curso.
- Publicación hub según tu script; URL `/pumuki/` 200.
