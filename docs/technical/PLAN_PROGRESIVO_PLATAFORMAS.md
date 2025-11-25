# Plan Progresivo de Plataformas en Monorepo

> **Actualización 2025-11-11 (Auditoría rápida)**  \
> • El hook-system quedó reforzado (NotificationCenter, HealthCheck, AutoRecovery, EvidenceContextManager y suites de integración) y los commits convencionales se validan vía hook `commit-msg` local + baseline de detect-secrets actualizado.  \
> • Existen esqueletos para `apps/ios`, `apps/android` y `packages/shared-*`, pero todavía contienen código demostrativo; no hay builds ni pipelines productivos.  \
> • Los workflows multi-plataforma (`ci-ios`, `ci-android`, `ci-contract-tests`, `nightly-*`) están en el repositorio pero dependen de credenciales/infraestructura pendientes.  \
> • Branch protection automática quedó bloqueada por limitación del plan GitHub Free; se reforzó la alternativa local (`git-wrapper.sh`, pre-receive, conventional commit hook) mientras se define upgrade.  \
> • La documentación requiere limpieza (auditoría en marcha) y sincronización con el estado real.

## Backlog consolidado (11/11/2025)

| Estado | Tarea | Responsable(s) | Fecha objetivo | Observaciones |
| --- | --- | --- | --- | --- |
| 🚫 | Evaluar y, si procede, contratar upgrade GitHub Pro/Enterprise para habilitar branch protection nativa | Platform Chapter / Product | 15/11/2025 | Mientras tanto se mantiene enforcement local (`git-wrapper`, pre-receive, commit-msg hook). |
| ⏳ | Documentar en `docs/technical/hook-system/overview/GOVERNANCE.md` el fallback de branch protection + proceso de upgrade | Arquitectura / DevOps | 12/11/2025 | Añadir enlace al backlog de upgrade y recordatorio de guardias locales. |
| ⏳ | Ejecutar training flash y publicar grabación + checklist en la wiki interna | Arquitectura / Product | 12/11/2025 | El mensaje Slack está listo en `docs/technical/hook-system/communications/PR_TEMPLATE_ANNOUNCEMENT_2025-11-11.md`. |
| ⏳ | Incorporar checklist de limpieza manual en onboarding y wiki | Arquitectura | 12/11/2025 | Complementa el plan de socialización. |
| ⏳ | Definir dashboard de métricas (Grafana/Datadog) + export automático de nightly | DevOps / Platform Chapter | 29/11/2025 | Requiere recopilar métricas de pipelines y health-check. |
| 🚧 | Configurar publicación automática por componente (secrets + comandos reales) | Platform Chapter / DevOps | 30/11/2025 | `publish-component.sh` genera plan; falta wiring con credenciales oficiales. |
| 🚧 | Habilitar pipelines móviles con credenciales reales (Apple/Play) | Mobile Leads / DevOps | 05/12/2025 | Workflows `ci-ios` y `ci-android` siguen en modo plan. |
| ⏳ | Completar definición del Platform Chapter + SLA preliminar | Arquitectura | Q4 2025 | Presentar propuesta a dirección y validar métricas. |

## 1. Resumen ejecutivo

Mantener frontend (React/Next.js), backend (NestJS), iOS (Swift/SwiftUI) y Android (Kotlin/Compose) dentro de un mismo monorepo acelera la visibilidad transversal y la trazabilidad de cambios, pero incrementa el riesgo de deuda técnica y regresiones cuando el repositorio carece de un gobierno estricto. Este documento analiza los riesgos críticos detectados, su impacto y las estrategias de mitigación recomendadas apoyándonos en el hook-system actual, automatizaciones CI/CD y una estructura modular clara.

## 2. Contexto actual

- El monorepo alberga ya los proyectos web (`apps/admin-dashboard`, `apps/web-app`) y backend, mientras que las apps móviles están planificadas para la siguiente fase.
- La capa de automatización (`hooks-system`) valida evidencia, separa features y evita commits no atómicos, pero requiere reforzarse para la entrada de nuevas plataformas.
- Objetivo: garantizar mantenibilidad, escalabilidad, calidad y releases coordinados sin fricción entre plataformas.

## 3. Riesgos y deuda técnica por dimensión

### 3.1 Mantenibilidad
- **Descripción:** aumento de complejidad cuando conviven proyectos con stacks distintos y ciclos de actualización independientes.
- **Riesgos:** revisiones de PR más extensas, curva de aprendizaje elevada para nuevos contribuidores, posibilidades de roturas cruzadas.
- **Deuda técnica potencial:** scripts ad-hoc, documentación desactualizada, tooling duplicado.

### 3.2 Escalabilidad organizativa
- **Descripción:** equipos distribuidos trabajando en módulos heterogéneos.
- **Riesgos:** cuellos de botella si los ownerships no están definidos, falta de acuerdos sobre patrones comunes.
- **Deuda técnica:** dependencias globales acopladas (p. ej. linters compartidos sin versionado controlado).

### 3.3 Desarrollo multiplataforma
- **Descripción:** coexistencia de web, backend y mobile.
- **Riesgos:** divergencias en modelos de dominio, contratos de API no sincronizados, duplicación de lógica.
- **Deuda técnica:** falta de SDKs compartidos, ausencia de un catálogo de DTOs versionado.

### 3.4 Testabilidad
- **Descripción:** suites heterogéneas (Jest, Vitest, XCTest, JUnit) con ejecuciones independientes.
- **Riesgos:** tiempos de feedback elevados, flakiness en pipelines, cobertura dispar entre plataformas.
- **Deuda:** falta de matriz de pruebas unificada, inexistencia de smoke-tests cruzados.

### 3.5 Reutilización y compatibilidad de código
- **Descripción:** compartir contratos, utilidades y assets sin romper aislamiento.
- **Riesgos:** importaciones circulares, uso inadecuado de módulos internos, divergencia de modelos.
- **Deuda:** módulos “shared” monolíticos, utilidades copiadas.

### 3.6 Modularización y arquitectura
- **Descripción:** mantener principios de Clean Architecture en cada plataforma con dependencia hacia dentro.
- **Riesgos:** mezclar capas (p. ej. `presentation` accediendo a `infrastructure` de otra plataforma), falta de interfaces contractuales.
- **Deuda:** ausencia de límites de contexto, carpetas sin jerarquía común.

### 3.7 Gestión de dependencias
- **Descripción:** coexistencia de npm/PNPM, Swift Package Manager y Gradle.
- **Riesgos:** inconsistencias de versiones, tiempos de instalación altos, dependencias globales desactualizadas.
- **Deuda:** scripts sin cacheo, falta de lockfiles sincronizados, ausencia de mirrors.

### 3.8 Integración continua
- **Descripción:** pipelines específicos por plataforma más pipelines integradores.
- **Riesgos:** pipelines demasiado largos, ejecuciones redundantes, falta de gating para móviles.
- **Deuda:** workflows duplicados, carencia de smoke-tests globales (ya mitigado parcialmente con el monitor de tokens).

### 3.9 Gestión de releases
- **Descripción:** sincronizar tags y releases multicanal.
- **Riesgos:** divergencia entre versiones mobile y web, procesos manuales, hotfixes urgentes sin control.
- **Deuda:** ausencia de versionado semántico coordinado, falta de scripts de publicación automatizados.

### 3.10 Resolución de conflictos y gobernanza de merges
- **Descripción:** múltiples equipos tocando archivos compartidos.
- **Riesgos:** conflictos frecuentes en configuración (p. ej. `.github/workflows`, `.AI_EVIDENCE.json`), pérdida de contexto en PR masivas.
- **Deuda:** falta de reglas de codeowners, ausencia de plantillas de PR específicas.

## 4. Estrategias de mitigación

### 4.1 Estructura modular recomendada
- Mantener un árbol por plataforma bajo `apps/` y `packages/` para librerías compartidas:
  - `apps/backend`, `apps/admin-dashboard`, `apps/web-app`, `apps/ios`, `apps/android`.
  - `packages/shared-domain`: modelos y DTOs generados (OpenAPI/Quicktype) versionados.
  - `packages/tooling`: scripts reutilizables (p. ej. `verify-token-monitor`).
- **Estado actual:** existen las carpetas base (`apps/ios`, `apps/android`, `packages/shared-domain`, `packages/tooling`, `packages/shared-types/generated/{ts,kotlin,swift}`) con esqueletos y documentación, pero el código mobile está en modo demo y todavía no se compone una Clean Architecture completa por plataforma.
- **Pendiente:** validar que cada módulo mobile siga la jerarquía `domain/application/infrastructure/presentation` antes de habilitar builds reales.

### 4.2 Gestión de dependencias
- NPM/PNPM: usar workspaces con versionado fijo y cache en CI.
- Swift: Swift Package Manager con mirrors internos y lockfiles (`Package.resolved`).
- Android: Gradle version catalogs (`libs.versions.toml`).
- ✅ `nightly-dependency-audit.sh` y el workflow homónimo están versionados.
- ⏳ Falta validar en ejecución real (dependen de runners con Gradle/Swift y de secrets). Mientras tanto continúan ejecutándose sólo en modo plan.
- ✅ Nightly audit centralizado: `scripts/automation/nightly-dependency-audit.sh` + workflow `nightly-dependency-audit.yml` ejecutan `npm audit`, `./gradlew dependencyUpdates` (via plugin Ben Manes) y `swift package update`, publicando artefactos históricos.

### 4.3 CI/CD multitecnología
- Pipelines por plataforma (lint, test, build) + pipelines integradores (contratos compartidos, smoke-tests). Ejemplo:
  - `ci/frontend.yml`, `ci/backend.yml`, `ci/ios.yml`, `ci/android.yml`.
  - `ci/contract-tests.yml`: asegura que DTOs compartidos se regeneran sin diffs.
  - `ci/nightly-token-monitor.yml`: verificación diaria del hook-system.
- Estrategia de gates: PR bloqueada hasta que supere los pipelines de la plataforma tocada.
- Uso de matrices para ejecutar suites en paralelo y reducir tiempos.
- ✅ Workflows `ci-ios.yml`, `ci-android.yml`, `ci-contract-tests.yml` y `nightly-platform-smoke.yml` están definidos.
- ⏳ Requieren credenciales y runners con Xcode/Android SDK para ejecutarse realmente; hoy se mantienen deshabilitados en los pipelines protegidos.
- ⏳ Integrar los resultados en branch protection (bloqueada hasta upgrade de plan) una vez estén operativos.

### 4.4 Gobernanza del hook-system
- Mantener `.AI_EVIDENCE.json` como contrato de cumplimiento antes de cada commit. ✅  (validador endurecido + EvidenceContextManager).
- Refuerzo reciente: NotificationCenterService, HealthCheckService, AutoRecoveryManager y suites de integración están activos.
- ⏳ Validadores mobile (`swiftlint`, `detekt`) definidos pero siguen en modo opcional; completar antes de abrir módulos productivos.
- ⏳ `git-wrapper.sh` y GitFlow Enforcer controlan naming/atomicidad, pero aún no impiden abandonar ramas `fix/*`; se requiere follow-up para implementar la restricción descrita originalmente.
- ⏳ RealtimeGuardService no vigila aún ramas remotas `fix/*`; considerar automatización futura o eliminar del alcance.
- 🚧 Socialización pendiente: plantilla PR multi-plataforma y plan de upgrade para branch protection (ver 4.6) todavía en proceso.

### 4.5 Gestión de releases
- Versionado semántico por componente (tags `backend-vX.Y.Z`, `ios-vX.Y.Z`, etc.) coordinados mediante GitHub Actions.
- Plantillas de release notes con secciones por plataforma.
- Estrategia de branch: `develop` como integración, ramas `release/{platform}` para preparar entregas.
- Uso de herramientas como Fastlane (mobile) y Semantic Release (web/backend) para automatizar la publicación.
- Estado actual (seguimiento visual):
  - ✅ Bump semántico y changelog automático por componente (`scripts/tooling/bump-version.sh`, `scripts/tooling/validate-changelog.sh`, check en `pre-merge-validation.yml`).
  - ✅ Tagging automatizado con notas de release (`scripts/tooling/tag-release.sh` + workflow `.github/workflows/component-release.yml`).
  - 🚧 Publicación automática por componente (script `publish-component.sh` ya genera plan/ejecución e informe JSON; restan comandos reales y credenciales por plataforma).
  - ⏳ Playbooks de rollback y checklist operativo multi-plataforma (pendiente tras automatizar publicación).
- Estado por componente:
  - ✅ Backend: pipeline ejecuta pruebas, empaqueta con `npm pack` y publica el artefacto `apps/backend/*.tgz` mediante `.github/workflows/component-release.yml` (incluye reporte JSON `--report`).
  - 🚧 Admin: pipeline en modo plan (build + `next export` → `.release/admin-dashboard-<version>.tar.gz`) con reporte JSON; falta comando final de publicación, credenciales (`ADMIN_CDN_TOKEN`, `ADMIN_CDN_ACCOUNT`) y destino.
  - 🚧 Web: pipeline en modo plan (build Vite → `.release/web-app-<version>.tar.gz`) + reporte JSON; falta decidir destino (CDN/NPM), secretos (`WEB_CDN_TOKEN`) y habilitar `syncVersion` real.
  - 🚧 Shared-types: `npm run build` + `npm pack --pack-destination .release`; versionado sincronizado con `scripts/tooling/version-shared-packages.sh`, falta seleccionar registro interno y credenciales (`SHARED_REGISTRY_TOKEN`, `SHARED_REGISTRY_URL`). Ver `docs/technical/hook-system/releases/SHARED_PACKAGES_RELEASE.md`.
  - 🚧 Shared-domain: pipeline igual al de shared-types (`npm pack`), pendiente definir registro/credenciales (`SHARED_REGISTRY_TOKEN`, `SHARED_REGISTRY_URL`).
  - 🚧 iOS: comandos Fastlane en modo plan (`publish-component.sh` ejecuta lanes `beta`/`distribute`), smoke tests integrados en CI (`ci-ios.yml` → `scripts/mobile/smoke-tests.sh ios`); falta proyecto real (Package.swift/xcodeproj) y credenciales.
  - 🚧 Android: comandos Gradle en modo plan (`publish-component.sh` ejecuta bundle/publish), smoke tests integrados en CI (`ci-android.yml` prepara SDK API 34 y lanza `scripts/mobile/smoke-tests.sh android`); falta consolidar módulo productivo y credenciales Play Console.
  - ✅ Gate de auditoría: el flujo `component-release.yml` ejecuta `nightly-dependency-audit.sh` antes de publicar, bloqueando releases si `npm audit`/`dependencyUpdates`/`swift package` fallan.

### 4.6 Resolución de conflictos y code ownership
- Estado actual (11/11/2025):
  - ✅ CODEOWNERS publicado en `.github/CODEOWNERS` y reflejado en `docs/technical/hook-system/overview/OWNERSHIP_AND_ROADMAP.md`.
  - ✅ Plantilla PR multi-plataforma (`.github/pull_request_template.md`) con checklists por plataforma.
  - ✅ Hook-system reforzado: commits atómicos, bloqueo al salir de ramas `fix/*` y recordatorios de limpieza.
  - ✅ Validación de mensajes convencionales: hook `commit-msg` local (Python) invocando `conventional-pre-commit` garantiza formato antes del pre-receive.
  - 🚫 Branch protection automática: GitHub Free devuelve `HTTP 403 Upgrade to GitHub Pro`. Se mantiene enforcement local (`git-wrapper.sh`, pre-receive hook, conventional commit hook) hasta contar con plan superior.
- Próximos pasos:
  - ✅ Documentar el uso de CODEOWNERS y la plantilla PR desde el plan (ver sección **Guía rápida CODEOWNERS y plantilla PR**) – Arquitectura, 10/11/2025.
  - ⏳ Registrar en `docs/technical/hook-system/overview/GOVERNANCE.md` la limitación de branch protection y el fallback obligatorio (Arquitectura/DevOps – 12/11/2025).
  - ⏳ Levantar backlog para evaluar upgrade a GitHub Pro/Enterprise y reintentar `scripts/tooling/apply-branch-protection.sh` cuando haya presupuesto (Platform Chapter/Product – 15/11/2025).
  - 🚧 Socializar la plantilla PR multitecnología con todo el equipo – Arquitectura/Product, 11/11/2025 (se mantiene aunque branch protection esté bloqueada).
    - ✅ Preparar anuncio en Slack #platform con resumen del flujo y enlace a la plantilla (`docs/technical/hook-system/communications/PR_TEMPLATE_ANNOUNCEMENT_2025-11-11.md`).
    - ⏳ Organizar training flash (15 min) con walkthrough del checklist y casos comunes (ver guía en `docs/technical/hook-system/guides/PR_TEMPLATE_SOCIALIZATION.md`).
    - ⏳ Actualizar onboarding interno (wiki) y referenciar el checklist en `docs/technical/hook-system/overview/OWNERSHIP_AND_ROADMAP.md` y la guía recién creada.
    - ⏳ Recabar feedback tras la primera semana y ajustar la plantilla si emergen gaps.

**Plan de socialización de plantilla PR (11/11/2025)**
- Enviar anuncio en Slack #platform con enlace a la plantilla y checklist resumido.
- Realizar sesión breve (15 min) para repasar el flujo (branch protection + owners) y resolver dudas.
- Añadir la checklist al onboarding de nuevos devs en la wiki interna.

- Reglas clave (recordatorio):
  - Ramas feature cortas y commits atómicos.
  - Codeowners responsables de aprobar cambios en su módulo.
  - Resolver conflictos con visibilidad del owner desde la primera iteración.

#### Guía rápida CODEOWNERS y plantilla PR (10/11/2025)

1. Confirmar el ámbito en `.github/CODEOWNERS` y agregar a los responsables si el archivo o directorio nuevo no está cubierto.
2. Iniciar cualquier PR desde la plantilla multi-plataforma y marcar únicamente las plataformas afectadas; las casillas restantes deben permanecer sin seleccionar.
3. Adjuntar evidencia de compilación/lint y pruebas tal como exige la sección “Checklist por plataforma”.
4. Solicitar revisión explícita al owner correspondiente (GitHub sugiere automáticamente a partir de CODEOWNERS); si no aparece, mencionarlo manualmente.
5. Cerrar la PR solo cuando los pipelines verdes coincidan con las plataformas marcadas y (hasta habilitar branch protection) exista confirmación explícita del owner + guardias locales en verde.
6. Cuando se modifique un directorio con owner, usar `@mention` explícito en la descripción para que reciban la notificación inmediata (prevención mientras se habilita branch protection).

**Branch protection (bloqueada hasta upgrade)**
- Limitaciones actuales: GitHub Free no permite configurar branch protection por API/UI → `HTTP 403 Upgrade to GitHub Pro`.
- Fallback vigente:
  - `scripts/hooks-system/infrastructure/shell/gitflow/git-wrapper.sh` bloquea pushes directos/force a `main` y `develop`.
  - Hook pre-receive en `scripts/hooks-system/infrastructure/git-server/pre-receive-hook` valida evidencia, nombres de rama y evita pushes no convencionales.
  - Hook `commit-msg` local (Python) garantiza formato Conventional Commit antes de alcanzar el pre-receive.
- Próximos pasos cuando exista presupuesto para upgrade:
  - Ejecutar `scripts/tooling/apply-branch-protection.sh` (`BRANCHES="main develop"`, `APPROVAL_COUNT=1`) y registrar contexts obligatorios.
  - Actualizar `docs/technical/hook-system/overview/GOVERNANCE.md` y anunciarlo en Slack/Teams.

### 4.7 Reutilización y contratos compartidos
- Generar SDKs/DTOs desde una fuente unificada (OpenAPI/GraphQL) publicados como paquetes internos.
- Documentar casuística de negocios en `docs/domain/` con matrices de compatibilidad.
- Mantener linters y convenciones comunes (naming, formateo) mediante toolchains compartidas (`prettier`, `swiftformat`, `ktlint`).
- Estado actual (10/11/2025):
  - ✅ Contrato corregido y artefactos generados para TS/Kotlin/Swift.
  - ✅ Librería enterprise del admin-dashboard restaurada (core + API + utils) y build Next.js validado tras reinstaurar el consumo de contratos compartidos (10/11/2025).
  - ⏳ Validación nocturna de DTOs detecta diferencias pero aún no bloquea (Arquitectura – objetivo 24/11/2025).
  - 🚧 Versionado semántico automatizado para paquetes compartidos pendiente (Backend/DevOps – objetivo 30/11/2025).
- Próximos pasos:
  - ✅ Añadir test de compatibilidad de DTOs en el nightly (`nightly-dependency-audit.sh`) (Arquitectura – 10/11/2025).
  - ✅ Publicar guía de contratos en `docs/domain/DTO_COMPATIBILITY.md` con matriz de compatibilidades (Arquitectura/Product – 10/11/2025).
  - ✅ Integrar `version-shared-packages.sh` dentro de `publish-component.sh` para sincronizar el bump semántico (Backend/DevOps – 10/11/2025).
  - 🚧 Definir registro interno y credenciales (`SHARED_REGISTRY_TOKEN`, `SHARED_REGISTRY_URL`) para shared packages (Platform Chapter – 05/12/2025).

- Seguimiento adicional:
  - Alertas del guard reforzadas con notificaciones en terminal y `terminal-notifier` (10/11/2025), manteniendo visibilidad inmediata cuando falle la validación de contratos o el supervisor.

**Plan de acción inmediato (contratos compartidos)**
1. **Arquitectura (completado 10/11)** – nightly `nightly-dependency-audit.sh` incluye verificación de DTO y genera `.audit-reports/dependency-audit/<subdir>/dto-diff.json`.
2. **Arquitectura/Product (completado 10/11)** – documentada la matriz de compatibilidades en `docs/domain/DTO_COMPATIBILITY.md`.
3. **Backend/DevOps (completado 10/11)** – `publish-component.sh` invoca `version-shared-packages.sh` para `shared-types` y `shared-domain`.
4. 🚧 **Platform Chapter / DevOps** → Definir registro privado y publicar guía operativa (05/12).

**Registro privado propuesto**
- Opción base: GitHub Packages (`ghcr.io/<org>/shared-packages`). Documentado en `docs/technical/hook-system/releases/SHARED_PACKAGES_RELEASE.md` con pasos para emitir token (`write:packages`) y probar publicación.
- Pendiente: crear cuenta técnica/bot y cargar secrets `SHARED_REGISTRY_URL`, `SHARED_REGISTRY_TOKEN` (y `SHARED_REGISTRY_USER` si aplica) en GitHub.
- Validar publicación real tras configurar secrets (pipeline `component-release.yml`).

### 4.8 Métricas y monitorización
- Cobertura mínima por plataforma (≥80%).
- Tiempo medio de pipeline, ratio de fallos, número de conflictos por release.
- Alertas (Slack/Teams) cuando el nightly smoke-test o los pipelines multitecnología fallen.
- Próximos pasos:
  - ⏳ Consolidar tablero con métricas clave (Datadog/Grafana) y publicar SLA por plataforma (DevOps – 29/11/2025).
  - ✅ Añadir alertas de fallback en `RealtimeGuardService` cuando falle smoke nocturno o el heartbeat (terminal + notificación nativa) – DevOps, 10/11/2025.
  - 🚧 Registrar histórico de fallos en `.audit-reports/nightly/` para análisis semanal (Platform Chapter – desde 18/11/2025).

**Plan de acción inmediato (métricas)**
1. ⏳ **DevOps (antes 15/11)** – definir dashboard base en Grafana (paneles: estado guards, duración pipelines, ratio fallos nocturnos).
2. ⏳ **Platform Chapter (desde 18/11)** – automatizar export de resultados de nightly a `.audit-reports/nightly/YYYY-MM-DD.json`.
3. ⏳ **Arquitectura (antes 22/11)** – proponer SLA preliminar (tiempos máximos pipeline/nightly) y añadirlos a la tabla de métricas.

## 5. Roadmap por fases

### 5.1 Corto plazo (1-2 semanas)
- Consolidar estructura de carpetas definitiva y codeowners.
- Documentar contratos compartidos y regeneracion automatica de DTOs.
- Extender hook-system para iOS/Android (lint + build) hoy como paso critico para impedir regresiones.
- Entregables: repositorio limpio (<20 staged, <40 working), workflows mobile en estado verde, checklist de limpieza manual circulando.
- Estado (10/11/2025):
  - ✅ Refactor hook-system (NotificationCenter, TokenMonitor, HealthCheck, AutoRecovery, EvidenceContextManager, integración de pruebas).
  - ⏳ Documentación de contratos compartidos: guía creada pero falta consolidarla en onboarding y en `docs/domain/` (en curso).
  - 🚧 Workflows mobile: necesitan credenciales + dispositivos; mantener en backlog.
  - ⏳ Checklist de limpieza manual: pendiente publicar en wiki.

**Acciones pendientes (S0-S2)**
- ⏳ Arquitectura → Publicar checklist de limpieza manual en la wiki (12/11).
- ⏳ DevOps → Documentar fallback de branch protection (GOVERNANCE.md) y crear backlog para upgrade de plan GitHub (12/11).
- ⏳ Product Chapter → Coordinar sesión de socialización de plantilla PR (11/11).

### 5.2 Medio plazo (4-6 semanas)
- Integrar pipelines especificos para apps moviles (Fastlane, Gradle Managed Devices) y smoke-tests incrementales.
- Automatizar regeneracion de SDK/DTO y validar contratos entre plataformas en cada PR.
- Completar automatizacion de tagging + publicacion por componente (siguiente paso tras el changelog automatico).
- Entregables: pipeline mobile estable, reporte de contratos en nightly, script `publish-component.sh` con credenciales configuradas en secrets.
- Estado (10/11/2025):
  - ⏳ Fastlane/Gradle: scripts en modo plan; falta infraestructura (hardware/cloud runners).
  - 🚧 Validación de contratos en PR: nightly detecta diferencias pero aún no bloquea la build (Back/Arquitectura).
  - ⏳ `publish-component.sh` produce plan con reporte JSON; falta wiring con secrets oficiales y credenciales (DevOps – 30/11/2025).

**Acciones siguientes (S3-S6)**
- ⏳ Mobile Leads + DevOps → Evaluar runners dedicados y costos para Fastlane/Gradle (propuesta 20/11).
- ⏳ Backend/Arquitectura → Activar validación de contratos como gate en PR tras estabilizar nightly (meta 24/11).
- ⏳ DevOps → Completar wiring de `publish-component.sh` con secretos de cada componente (30/11).
4. 🚧 **Platform Chapter** → Definir registro privado y publicar guía operativa (05/12).

### 5.3 Largo plazo (3-6 meses)
- Evaluar herramientas de orquestacion monorepo (Nx, Turborepo, Bazel) si las builds empiezan a ser criticas.
- Establecer un "Platform Chapter" con ownership compartido del tooling y rotacion de guard-duty.
- Revisar periodicamente la matriz de metricas y ajustar SLA por plataforma con soporte de dashboards de observabilidad.
- Entregables: decision documentada sobre orquestacion, plan de staffing del chapter y tablero de metricas en observabilidad.
- Ideas actuales (10/11/2025):
  - ⏳ Evaluando Turborepo (sandbox) y recopilando métricas de build para justificar inversión.
  - 🚧 Propuesta inicial del Platform Chapter redactada por Arquitectura (pendiente presentación a dirección).
  - ⏳ SLA preliminar (build <15min, nightly <25min) a validar con métricas reales.

## 6. Organización y responsabilidades

- **Chapter Leads por plataforma:** responsables de mantener pipelines, documentación y calidad del código.
- **DevOps Platform Team:** mantiene el hook-system, workflows y smoke-tests (incluyendo monitor nocturno).
- **Equipo de Arquitectura:** revisa contratos compartidos y asegura consistencia de Clean Architecture.
- **Product/Release Manager:** coordina cadencia de releases multicanal y comunicación con stakeholders.
- **Referencias cruzadas:**
  - `.github/CODEOWNERS`
  - `.github/pull_request_template.md`
  - `docs/technical/hook-system/overview/OWNERSHIP_AND_ROADMAP.md`
  - `docs/technical/hook-system/overview/GOVERNANCE.md`

## 7. Seguimiento resumido (10/11/2025)

| Área | Estado | Responsable(s) | Fecha objetivo | Comentarios |
| --- | --- | --- | --- | --- |
| CODEOWNERS + Plantilla PR | ✅ Completo | Arquitectura / DevOps | 10/11/2025 | Branch protection bloqueada por plan GitHub Free; se usa fallback local (`git-wrapper`, pre-receive, commit-msg hook) hasta upgrade |
| Contratos compartidos | ⏳ En progreso | Arquitectura / Backend | 24/11/2025 | Validación nightly y guía en `docs/domain/` |
| Admin dashboard enterprise | ✅ Completo | Arquitectura / Frontend | 10/11/2025 | Core + API restaurados y build Next.js verificada |
| Métricas y dashboards | ⏳ En progreso | DevOps | 29/11/2025 | Alertas guard supervisor activas (terminal + macOS); falta tablero Grafana |
| Publicación por componente | 🚧 Pendiente | Platform Chapter / DevOps | 30/11/2025 | Configurar secrets y comandos reales |
| Pipelines móviles con credenciales | 🚧 Pendiente | Mobile Leads / DevOps | 05/12/2025 | Falta acceso Apple Dev / Play Console |
| Platform Chapter + SLA | ⏳ En progreso | Arquitectura | Q4 2025 | Presentar propuesta y validar métricas reales |

## 8. Conclusión

El monorepo ofrece una ventaja clara en sincronización de código y visibilidad compartida, pero demanda disciplina en modularización, automatización y gobernanza. Con las estrategias propuestas (estructura modular, pipelines específicos, smoke-tests nocturnos, code ownership y versionado controlado) podemos mitigar la deuda técnica, reducir regresiones y garantizar releases estables para las cuatro plataformas. El hook-system actúa como primera línea de defensa; reforzarlo e integrarlo con los workflows nocturnos mantiene la salud del repositorio a medida que el ecosistema multitecnología crece.
