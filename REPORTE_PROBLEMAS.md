# 🐛 Reporte de Problemas - AST Intelligence Hooks Library

**Fecha:** 2025-12-14  
**Estado:** Crítico - Múltiples problemas de funcionamiento  
**Preparado para:** Windsurf AI / Otro modelo de IA

---

## 📋 RESUMEN EJECUTIVO

La librería `ast-intelligence-hooks` tiene problemas críticos de funcionamiento que impiden su uso correcto. El principal problema es la **discrepancia entre violaciones reportadas en `.AI_EVIDENCE.json` y los resultados reales de los audits**.

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. Discrepancia en Violaciones de `.AI_EVIDENCE.json`

**Problema:**
- `.AI_EVIDENCE.json` guarda violaciones que no corresponden con el audit de staging
- Ejemplo: Audit opción 3 (Strict STAGING only) muestra 0 violaciones, pero `.AI_EVIDENCE.json` tiene 17/41 violaciones
- Las violaciones provienen de ejecuciones anteriores (audit opción 2 que analiza todo el repo)

**Ubicación del código:**
- `/infrastructure/orchestration/intelligent-audit.js` línea 30
- `/bin/update-evidence.sh` línea 950-960
- `/infrastructure/ast/ast-intelligence.js` función `listSourceFiles()`

**Cambios realizados (PENDIENTE VERIFICACIÓN):**
- ✅ `intelligent-audit.js`: Cambiado `violationsForEvidence = rawViolations` a `violationsForEvidence = stagedViolations`
- ✅ `update-evidence.sh`: Agregado limpieza de `ast-summary.json` antes de ejecutar en modo staging
- ✅ `ast-intelligence.js`: Agregado soporte para `STAGING_ONLY_MODE=1` en `listSourceFiles()`

**Estado:** Cambios implementados pero NO VERIFICADOS completamente. Puede haber problemas residuales.

---

### 2. Pre-commit Hook - Notificación Incorrecta de Violaciones

**Problema:**
- El pre-commit hook bloquea commits pero muestra recuento incorrecto de violaciones
- La notificación muestra violaciones del repo completo en lugar de solo staged files
- Hay discrepancias entre:
  - Violaciones en `.AI_EVIDENCE.json` (17)
  - Violaciones del audit opción 2 (69 - todo el repo)
  - Violaciones del audit opción 3 (0 - solo staging)

**Ubicación del código:**
- `/bin/install.js` - Template del pre-commit hook (línea ~620)
- El hook ejecuta `ast-hooks ast` y luego `intelligent-audit.js`
- El hook lee `.AI_EVIDENCE.json` para contar violaciones, pero ese archivo puede tener violaciones del repo completo

**Cambios realizados (PENDIENTE VERIFICACIÓN):**
- ✅ Pre-commit hook modificado para parsear OUTPUT de `ast-hooks ast` en lugar de `.AI_EVIDENCE.json`
- ⚠️ **PROBLEMA:** El hook todavía puede estar leyendo violaciones incorrectas

**Estado:** Parcialmente resuelto, necesita verificación exhaustiva.

---

### 3. `ai_gate_check` No Se Ejecuta Automáticamente

**Problema:**
- `ai_gate_check` debería ejecutarse automáticamente antes de cada respuesta de la IA
- Actualmente NO se ejecuta automáticamente
- El usuario reporta: "tú no ejecutas el ai_gate nunca, y en el repo de R_G_local si se ejecutaba prácticamente todo"

**Ubicación del código:**
- `/.claude/hooks/pre-tool-use-evidence-validator.ts` - Hook de Cursor/Claude
- `/bin/session-loader.sh` - Script ejecutado en `folderOpen`
- `/bin/update-evidence.sh` - Script que actualiza evidence

**Cambios realizados:**
- ✅ `pre-tool-use-evidence-validator.ts`: Agregado `updateEvidenceWithGateCheck()` al inicio de `main()`
- ✅ `session-loader.sh`: Modificado para ejecutar `update-evidence.sh` sin `--refresh-only` si evidence está stale
- ⚠️ **PROBLEMA:** Puede haber problemas con la detección de evidencia stale o con la ejecución del hook

**Estado:** Implementado pero NO VERIFICADO que funcione correctamente.

---

### 4. Auto-commit Feature Causa Confusión

**Problema:**
- El auto-commit estaba haciendo commits automáticos sin permiso del usuario
- Fue deshabilitado temporalmente, luego re-habilitado con mejoras
- El filtrado de archivos para auto-commit puede no funcionar correctamente en todos los proyectos

**Ubicación del código:**
- `/infrastructure/mcp/gitflow-automation-watcher.js`
- Lógica de auto-commit (línea ~200-300)
- Filtrado de archivos del proyecto vs librería

**Cambios realizados:**
- ✅ Auto-commit mejorado para filtrar solo archivos de código del proyecto
- ✅ Detección dinámica de ruta de instalación de la librería
- ⚠️ **PROBLEMA:** El filtrado puede ser "chapuza" según el usuario - hardcoded para el proyecto demo

**Estado:** Funcional pero puede necesitar mejoras para ser genérico.

---

## 🟡 PROBLEMAS MENORES

### 5. Formato de Timestamp No Legible

**Problema:**
- Los timestamps se muestran en formato raw (segundos) en lugar de formato legible
- Ejemplo: "180s" en lugar de "3m"

**Ubicación:**
- `/bin/session-loader.sh` - Formateo de `EVIDENCE_AGE`

**Estado:** ✅ RESUELTO - Implementado formateo legible (minutos, horas, días)

---

### 6. Múltiples Scripts de Gestión de Librería

**Problema:**
- Había múltiples scripts: `update-library.sh`, `fresh-install.sh`, `reset-project.sh`
- Causaba confusión al usuario

**Estado:** ✅ RESUELTO - Unificado en `manage-library.sh` con opciones claras

---

## 📁 ARCHIVOS CRÍTICOS A REVISAR

### 1. `/infrastructure/orchestration/intelligent-audit.js`
- **Línea 30:** `violationsForEvidence = stagedViolations` (cambio reciente)
- **Línea 101-112:** `loadRawViolations()` - Lee `ast-summary.json`
- **Línea 193-208:** `updateAIEvidence()` - Guarda violaciones en `.AI_EVIDENCE.json`
- **PROBLEMA:** Puede estar guardando violaciones incorrectas si `ast-summary.json` tiene datos antiguos

### 2. `/bin/update-evidence.sh`
- **Línea 950-960:** Ejecuta `ast-intelligence.js` con `STAGING_ONLY_MODE=1`
- **PROBLEMA:** Limpia `ast-summary.json` pero puede haber race conditions o problemas de timing

### 3. `/infrastructure/ast/ast-intelligence.js`
- **Línea 246-270:** `listSourceFiles()` - Filtra archivos según `STAGING_ONLY_MODE`
- **PROBLEMA:** La lógica de filtrado puede no funcionar correctamente en todos los casos

### 4. `/bin/install.js`
- **Línea ~620:** Template del pre-commit hook
- **PROBLEMA:** El hook puede estar contando violaciones incorrectas

### 5. `/.claude/hooks/pre-tool-use-evidence-validator.ts`
- **Línea ~50:** `updateEvidenceWithGateCheck()` - Ejecuta gate check automáticamente
- **PROBLEMA:** Puede no ejecutarse correctamente o puede tener problemas de timing

---

## 🔍 FLUJO ACTUAL (PROBLEMÁTICO)

1. **Usuario ejecuta audit opción 2** → Genera `ast-summary.json` con 69 violaciones (todo el repo)
2. **Usuario ejecuta `update-evidence.sh`** → Debería limpiar `ast-summary.json` y generar solo staging
3. **Si no hay archivos staged** → Debería generar `ast-summary.json` vacío o no generarlo
4. **`intelligent-audit.js` lee `ast-summary.json`** → Filtra por staging
5. **Si no hay staging** → Debería guardar 0 violaciones en `.AI_EVIDENCE.json`
6. **PROBLEMA:** Puede estar leyendo `ast-summary.json` antiguo o guardando violaciones incorrectas

---

## ✅ LO QUE SÍ FUNCIONA

1. ✅ Audit opción 2 (Full repo) - Genera 69 violaciones correctamente
2. ✅ Audit opción 3 (Strict STAGING only) - Muestra 0 violaciones cuando no hay staging
3. ✅ Pre-commit hook bloquea commits cuando hay violaciones CRITICAL/HIGH
4. ✅ `session-loader.sh` se ejecuta en `folderOpen`
5. ✅ MCP servers se configuran correctamente
6. ✅ Instalación de hooks funciona

---

## ❌ LO QUE NO FUNCIONA

1. ❌ `.AI_EVIDENCE.json` no refleja correctamente violaciones de staging
2. ❌ Pre-commit hook muestra recuento incorrecto de violaciones en notificación
3. ❌ `ai_gate_check` no se ejecuta automáticamente antes de cada respuesta (NO VERIFICADO)
4. ❌ Auto-commit puede hacer commits no deseados (mejorado pero no perfecto)
5. ❌ Discrepancias entre diferentes fuentes de violaciones:
   - `.AI_EVIDENCE.json`: 17/41 violaciones
   - Audit opción 2: 69 violaciones
   - Audit opción 3: 0 violaciones
   - Pre-commit hook: ? violaciones

---

## 🎯 PRIORIDADES DE FIX

### PRIORIDAD 1 (CRÍTICO)
1. **Asegurar que `.AI_EVIDENCE.json` solo tenga violaciones de staging**
   - Verificar que `intelligent-audit.js` siempre use `stagedViolations`
   - Verificar que `update-evidence.sh` limpie `ast-summary.json` correctamente
   - Verificar que `ast-intelligence.js` respete `STAGING_ONLY_MODE=1`

2. **Pre-commit hook debe contar violaciones correctas**
   - Verificar que parsee OUTPUT de `ast-hooks ast` correctamente
   - Verificar que la notificación muestre solo violaciones de staging

### PRIORIDAD 2 (ALTA)
3. **`ai_gate_check` debe ejecutarse automáticamente**
   - Verificar que `pre-tool-use-evidence-validator.ts` ejecute gate check
   - Verificar que `session-loader.sh` ejecute gate check si evidence está stale

### PRIORIDAD 3 (MEDIA)
4. **Auto-commit debe ser más robusto**
   - Hacer el filtrado de archivos más genérico
   - Mejorar la detección de ruta de instalación de la librería

---

## 🧪 CASOS DE PRUEBA NECESARIOS

1. **Caso 1: Sin archivos staged**
   - Ejecutar `update-evidence.sh --auto`
   - Verificar que `.AI_EVIDENCE.json` tenga 0 violaciones
   - Verificar que `ast-summary.json` no exista o esté vacío

2. **Caso 2: Con archivos staged sin violaciones**
   - Agregar archivo staged sin violaciones
   - Ejecutar `update-evidence.sh --auto`
   - Verificar que `.AI_EVIDENCE.json` tenga 0 violaciones

3. **Caso 3: Con archivos staged con violaciones**
   - Agregar archivo staged con violaciones
   - Ejecutar `update-evidence.sh --auto`
   - Verificar que `.AI_EVIDENCE.json` tenga solo violaciones de ese archivo
   - Verificar que coincida con audit opción 3

4. **Caso 4: Pre-commit hook**
   - Agregar archivo staged con violaciones CRITICAL/HIGH
   - Intentar commit
   - Verificar que el hook bloquee
   - Verificar que la notificación muestre el recuento correcto

5. **Caso 5: `ai_gate_check` automático**
   - Abrir proyecto en Cursor
   - Verificar que `ai_gate_check` se ejecute automáticamente
   - Verificar que `.AI_EVIDENCE.json` se actualice

---

## 📝 NOTAS ADICIONALES

- El usuario reporta que en un repositorio anterior (`R_G_local`) todo funcionaba correctamente
- Los cambios recientes pueden haber introducido regresiones
- Hay múltiples puntos de entrada que pueden causar inconsistencias:
  - `update-evidence.sh`
  - `session-loader.sh`
  - `pre-tool-use-evidence-validator.ts`
  - Pre-commit hook
  - MCP tools

- El problema principal parece ser la **persistencia de `ast-summary.json`** entre ejecuciones
- Necesita una estrategia clara de limpieza y regeneración de `ast-summary.json`

---

## 🔧 RECOMENDACIONES

1. **Implementar limpieza explícita de `ast-summary.json` antes de cada ejecución de `ast-intelligence.js`**
2. **Agregar validación en `intelligent-audit.js` para verificar que las violaciones correspondan a archivos staged**
3. **Mejorar logging para rastrear de dónde vienen las violaciones**
4. **Agregar tests unitarios para verificar el flujo completo**
5. **Documentar claramente el flujo esperado en cada escenario**

---

**Última actualización:** 2025-12-14 09:05  
**Preparado por:** Auto (Cursor AI)  
**Para:** Windsurf AI / Otro modelo de IA

