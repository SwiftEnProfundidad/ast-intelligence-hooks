# Checklist Completo de Validación de Pumuki

Checklist maestro para validar el ciclo completo de Pumuki de forma secuencial antes del rollout en repositorios enterprise consumidores.

## Leyenda

- ✅ Completada
- 🚧 En progreso (solo 1 tarea activa)
- ⏳ Pendiente

## Política de validación

- Ejecutar las tareas en orden.
- Cerrar una tarea cada vez.
- Guardar evidencia de cada tarea (salida de comandos + resultado esperado).
- Cualquier warning/error detectado durante la ejecución debe corregirse de inmediato antes de continuar.

## Orden de ejecución recomendado

1. Preparación de entorno y baseline.
2. Distribución e instalación de paquete.
3. Lifecycle de Pumuki.
4. Stage gates runtime.
5. Detección multi-plataforma y evaluación combinada.
6. Rulesets, políticas y overrides.
7. Contrato de evidencia v2.1.
8. MCP evidence context server.
9. UX operativa (framework menu).
10. Suites deterministas y validaciones.
11. Fallos y recuperación.
12. Cierre de release.

## Tablero de tareas (ordenado)

### 1) Preparación de entorno y baseline

- ✅ 1.1 Confirmar repositorio consumidor objetivo y rama de trabajo.
- ✅ 1.2 Limpiar baseline del mock consumer (sin instalaciones temporales ni artifacts).
- ✅ 1.3 Confirmar estado base limpio antes de reinstalar Pumuki.

### 2) Distribución e instalación de paquete

- ✅ 2.1 Verificar metadata npm y dist-tags (`latest`, `next`) de la release objetivo.
- ✅ 2.2 Instalar `pumuki` desde npm en repositorio consumidor limpio.
- ✅ 2.3 Instalar hooks gestionados con `npx pumuki install` (validado en mock).
- ⏳ 2.4 Verificar disponibilidad de todos los binarios publicados:
  - `pumuki`
  - `pumuki-pre-commit`
  - `pumuki-pre-push`
  - `pumuki-ci`
  - `pumuki-mcp-evidence`
- ✅ 2.5 Verificar alineación `VERSION` + `package.json` + changelog/release notes.

### 3) Lifecycle de Pumuki

- ✅ 3.1 Ejecutar y validar `npx pumuki doctor` tras instalación en baseline limpia.
- ✅ 3.2 Ejecutar y validar `npx pumuki status` tras instalación.
- ✅ 3.3 Validar `npx pumuki update --latest` (idempotencia y salud de hooks).
- ✅ 3.4 Validar `npx pumuki uninstall --purge-artifacts` (solo hooks + artifacts gestionados).
- ✅ 3.5 Validar `npx --yes pumuki remove` (limpieza total de rastro Pumuki sin tocar terceros).
- ✅ 3.6 Validar idempotencia lifecycle (ciclo install/remove repetido).
- ✅ 3.7 Validar guardrail: install/update falla si hay `node_modules` tracked.

### 4) Stage gates runtime

- ✅ 4.1 `pumuki-pre-commit` evalúa exclusivamente staged (`git diff --cached`).
- ✅ 4.2 `pumuki-pre-push` evalúa `upstream..HEAD`.
- ✅ 4.3 `pumuki-ci` evalúa `baseRef..HEAD` (`GITHUB_BASE_REF` o fallback).
- ✅ 4.4 Exit codes deterministas (`0` allow, `1` block).
- ✅ 4.5 Consistencia entre ejecución directa de binarios y ejecución vía hooks.

### 5) Detección multi-plataforma y evaluación combinada

- ✅ 5.1 Cobertura iOS (`*.swift`) en repos mixtos.
- ✅ 5.2 Cobertura backend (`apps/backend/**/*.ts`) en repos mixtos.
- ✅ 5.3 Cobertura frontend (`apps/frontend|apps/web`) en repos mixtos.
- ✅ 5.4 Cobertura android (`*.kt`, `*.kts`) en repos mixtos.
- ✅ 5.5 Commits/rangos multi-plataforma cargan rulesets combinados y salida combinada.
- ✅ 5.6 No hay falsos positivos de plataforma fuera de selectores.

### 6) Rulesets, políticas y overrides

- 🚧 6.1 Verificar carga de baseline packs:
  - `iosEnterpriseRuleSet`
  - `backendRuleSet`
  - `frontendRuleSet`
  - `androidRuleSet`
- ⏳ 6.2 Verificar políticas por stage:
  - PRE_COMMIT: block `CRITICAL`, warn `ERROR`
  - PRE_PUSH: block `ERROR`, warn `WARN`
  - CI: block `ERROR`, warn `WARN`
- ⏳ 6.3 Verificar aplicación de overrides de proyecto.
- ⏳ 6.4 Verificar enforcement de locked rules sin override explícito permitido.

### 7) Contrato de evidencia v2.1

- ⏳ 7.1 Se genera `.ai_evidence.json` en cada stage.
- ⏳ 7.2 Campos de esquema válidos (`version`, `snapshot`, `ledger`).
- ⏳ 7.3 Evidencia incluye plataformas activas y rulesets cargados.
- ⏳ 7.4 Orden determinista entre ejecuciones equivalentes.
- ⏳ 7.5 Suppressions/ledger se mantienen estables y machine-readable.

### 8) MCP evidence context server

- ⏳ 8.1 Arrancar `pumuki-mcp-evidence` desde contexto de repositorio consumidor.
- ⏳ 8.2 Validar endpoints/facetas MCP con payload shape válido.
- ⏳ 8.3 Validar lectura determinista del último `.ai_evidence.json`.
- ⏳ 8.4 Validar comportamiento cuando falta/corrompe evidencia.

### 9) UX operativa (framework menu)

- ⏳ 9.1 `npm run framework:menu` abre y ejecuta acciones esperadas.
- ⏳ 9.2 Acciones mapeadas a lifecycle/gates producen salidas esperadas.
- ⏳ 9.3 Acciones de reportes generan archivos en rutas esperadas.

### 10) Suites deterministas y validaciones

- ✅ 10.1 `npm run typecheck` pasa.
- ⏳ 10.2 `npm run test` pasa.
- ⏳ 10.3 `npm run test:deterministic` pasa.
- ⏳ 10.4 `npm run test:heuristics` pasa.
- ⏳ 10.5 `npm run test:mcp` pasa.
- ⏳ 10.6 `npm run test:stage-gates` pasa.
- ⏳ 10.7 `npm run validation:package-manifest` pasa.
- ⏳ 10.8 `npm run validation:lifecycle-smoke` pasa.
- ⏳ 10.9 `npm run validation:package-smoke` pasa.
- ⏳ 10.10 `npm run validation:package-smoke:minimal` pasa.
- ⏳ 10.11 `npm run validation:docs-hygiene` pasa.

### 11) Mock consumer: ciclo funcional completo

- ✅ 11.1 Escenario clean: pre-commit/pre-push/ci => `0`.
- ✅ 11.2 Escenario violations: pre-commit/pre-push/ci => `1` esperado.
- ✅ 11.3 Escenario mixed: comportamiento determinista combinado.
- ✅ 11.4 Cleanup lifecycle tras cada escenario deja baseline limpio.
- ✅ 11.5 Repetir matriz completa para confirmar repetibilidad exacta.

### 12) Fallos, recuperación y cierre de release

- ⏳ 12.1 PRE_PUSH sin upstream: guía clara y fallo seguro.
- ⏳ 12.2 CI sin `GITHUB_BASE_REF`: fallback correcto.
- ⏳ 12.3 Hook drift: `doctor` detecta y `install/update` restaura.
- ⏳ 12.4 Mismatch parcial lifecycle: detectado y recuperable.
- ⏳ 12.5 README/USAGE/INSTALLATION alineados con runtime actual.
- ✅ 12.6 CHANGELOG incluye cambios visibles para usuario.
- ✅ 12.7 Release probada en mock desde npm (no ruta local).
- ⏳ 12.8 Informe final go/no-go con enlaces a artifacts y logs.

## Criterio de salida

Todas las tareas deben estar en ✅ con evidencia de comandos almacenada y sin warnings/errores pendientes.
