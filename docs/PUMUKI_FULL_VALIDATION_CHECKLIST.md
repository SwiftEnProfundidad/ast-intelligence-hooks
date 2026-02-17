# Checklist Completo de Validación de Pumuki

Checklist maestro para validar el ciclo completo de Pumuki end-to-end antes del rollout en repositorios enterprise consumidores.

## Leyenda

- ✅ Completada
- 🚧 En progreso
- ⏳ Pendiente

## Política de validación

- Ejecutar las tareas en orden.
- Cerrar una tarea cada vez.
- Guardar evidencia de cada tarea (salida de comandos + resultado esperado).
- Cualquier warning/error detectado durante la ejecución debe corregirse de inmediato antes de continuar.

## Alcance

Este checklist cubre:

- distribución del paquete npm y superficie de comandos.
- gestión de lifecycle (`install`, `doctor`, `status`, `update`, `uninstall`, `remove`).
- stage gates (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- evaluación multi-plataforma (iOS, backend, frontend, android).
- rulesets, políticas por stage y comportamiento de overrides.
- evidencia determinista v2.1.
- MCP evidence context server.
- CLI/menú operativo del framework.
- suites deterministas/regresión.
- matriz de ejecución en mock-consumer.

## Tablero de tareas

### A. Paquete y distribución

- ✅ A1. Verificar que metadata npm y dist-tags (`latest`, `next`) coinciden con la release objetivo.
- ✅ A2. Verificar que el paquete se puede instalar desde npm en un repositorio consumidor limpio.
- ⏳ A3. Verificar que los binarios publicados están disponibles tras la instalación:
  - `pumuki`
  - `pumuki-pre-commit`
  - `pumuki-pre-push`
  - `pumuki-ci`
  - `pumuki-mcp-evidence`
- ✅ A4. Verificar que `VERSION`, versión en `package.json` y release notes/changelog están alineados.

### B. Gestión de lifecycle

- ✅ B1. `pumuki install` instala solo bloques gestionados de hooks y estado de lifecycle.
- ✅ B2. `pumuki doctor` devuelve PASS sobre baseline limpia.
- ✅ B3. `pumuki status` refleja lifecycle instalado y hooks gestionados.
- ⏳ B4. `pumuki update --latest` mantiene hooks gestionados idempotentes y saludables.
- ⏳ B5. `pumuki uninstall --purge-artifacts` elimina hooks gestionados y artifacts conocidos.
- ✅ B6. `pumuki remove` elimina todos los rastros de Pumuki y no toca dependencias de terceros.
- ⏳ B7. Guardrail de seguridad: `node_modules` tracked bloquea install/update según lo esperado.
- ✅ B8. Re-ejecutar ciclo install/remove dos veces para validar idempotencia.

### C. Runtime de stage gates

- ✅ C1. `pumuki-pre-commit` evalúa solo scope staged (`git diff --cached`).
- ✅ C2. `pumuki-pre-push` evalúa `upstream..HEAD`.
- ✅ C3. `pumuki-ci` evalúa `baseRef..HEAD` (`GITHUB_BASE_REF` o fallback).
- ✅ C4. Los exit codes son deterministas (`0` allow, `1` block).
- ⏳ C5. El comportamiento de gate es consistente entre binarios directos y ejecución por hooks.

### D. Detección de plataforma y evaluación combinada

- ⏳ D1. Cobertura del selector iOS (`*.swift`) funciona en repos mixtos.
- ⏳ D2. Cobertura del selector backend (`apps/backend/**/*.ts`) funciona en repos mixtos.
- ⏳ D3. Cobertura del selector frontend (`apps/frontend|apps/web`) funciona en repos mixtos.
- ⏳ D4. Cobertura del selector android (`*.kt`, `*.kts`) funciona en repos mixtos.
- ⏳ D5. Commit/range multi-plataforma dispara carga combinada de rulesets y salida combinada de gate.
- ⏳ D6. No se observan falsos positivos de plataforma fuera del scope de selectores.

### E. Rulesets, políticas y overrides

- ⏳ E1. Los baseline packs cargan correctamente:
  - `iosEnterpriseRuleSet`
  - `backendRuleSet`
  - `frontendRuleSet`
  - `androidRuleSet`
- ⏳ E2. Los umbrales por stage coinciden con defaults esperados:
  - PRE_COMMIT: block `CRITICAL`, warn `ERROR`
  - PRE_PUSH: block `ERROR`, warn `WARN`
  - CI: block `ERROR`, warn `WARN`
- ⏳ E3. Los overrides de proyecto aplican sin romper semántica de baseline locked.
- ⏳ E4. Locked rules siguen aplicándose cuando override no está permitido explícitamente.

### F. Contrato de evidencia v2.1

- ⏳ F1. Se genera `.ai_evidence.json` en cada ejecución de stage.
- ⏳ F2. Los campos del esquema de evidencia son válidos (`version`, `snapshot`, `ledger`).
- ⏳ F3. La evidencia incluye plataformas activas y rulesets cargados.
- ⏳ F4. El orden de la evidencia es determinista en ejecuciones equivalentes.
- ⏳ F5. Campos de suppressions/ledger se mantienen estables y machine-readable.

### G. MCP evidence context server

- 🚧 G1. Arrancar MCP evidence server (`pumuki-mcp-evidence`) desde contexto de repositorio consumidor.
- ⏳ G2. Validar que endpoints/facetas MCP responden con shape de payload válido.
- ⏳ G3. Validar que MCP lee el último `.ai_evidence.json` de forma determinista.
- ⏳ G4. Validar comportamiento MCP cuando falta o está corrupto el fichero de evidencia.

### H. UX operativa del framework

- ⏳ H1. `npm run framework:menu` abre y ejecuta acciones esperadas.
- ⏳ H2. Acciones del menú que mapean a comandos gate/lifecycle producen salidas esperadas.
- ⏳ H3. Acciones del menú que generan reportes de validación crean ficheros en rutas esperadas.

### I. Suites deterministas y de validación

- ✅ I1. `npm run typecheck` pasa.
- ⏳ I2. `npm run test` pasa.
- ⏳ I3. `npm run test:deterministic` pasa.
- ⏳ I4. `npm run test:heuristics` pasa.
- ⏳ I5. `npm run test:mcp` pasa.
- ⏳ I6. `npm run test:stage-gates` pasa.
- ⏳ I7. `npm run validation:package-manifest` pasa.
- ⏳ I8. `npm run validation:lifecycle-smoke` pasa.
- ⏳ I9. `npm run validation:package-smoke` pasa.
- ⏳ I10. `npm run validation:package-smoke:minimal` pasa.
- ⏳ I11. `npm run validation:docs-hygiene` pasa.

### J. Ciclo completo en mock consumer

- ✅ J1. Escenario clean: pre-commit/pre-push/ci => todo pasa (`0`).
- ✅ J2. Escenario violations: pre-commit/pre-push/ci => bloquea (`1`) según lo esperado.
- ✅ J3. Escenario mixed: comportamiento determinista combinado de bloqueos/warnings.
- ✅ J4. Limpieza lifecycle tras cada escenario deja el baseline del repositorio limpio.
- ⏳ J5. Re-ejecutar matriz para confirmar repetibilidad (mismos resultados en rerun).

### K. Rutas de fallo y recuperación

- ⏳ K1. PRE_PUSH sin upstream produce guía clara y ruta de fallo segura.
- ⏳ K2. CI sin `GITHUB_BASE_REF` hace fallback correcto a base ref por defecto.
- ⏳ K3. Recuperación de hook drift: `doctor` detecta y `install`/`update` restaura bloques gestionados.
- ⏳ K4. Mismatch parcial de estado lifecycle se detecta y es recuperable.

### L. Cierre de release

- ⏳ L1. Comandos en README/USAGE/INSTALLATION coinciden con comportamiento real runtime.
- ✅ L2. CHANGELOG incluye todos los cambios visibles para usuario.
- ✅ L3. Paquete release probado en mock consumer desde npm (no ruta local).
- ⏳ L4. Informe final go/no-go creado con enlaces a artifacts y logs de evidencia.

## Criterio de salida

Todas las tareas A1-L4 deben estar en ✅ con evidencia de comandos almacenada y sin warnings/errores pendientes.
