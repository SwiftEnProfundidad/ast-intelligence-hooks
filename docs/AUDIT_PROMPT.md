# Prompt de Auditoría Profunda — Deuda Técnica y Violaciones de Reglas

## Contexto del Proyecto

Este es un sistema de hooks AST para análisis estático de código (Pumuki AST Intelligence Hooks). El proyecto implementa:

- **Arquitectura determinística**: Facts → Rules → Gate → Evidence v2.1
- **Detección heurística** de patrones de código problemáticos (TypeScript, iOS, Android, seguridad, procesos, filesystem, etc.)
- **Sistema de reglas** con consolidación semántica y supresión de hallazgos equivalentes
- **Integración MCP** para contexto de evidencia
- **Gate policies** por stage (pre-commit, pre-push, CI)

## Reglas de Gobierno (AGENTS.md)

### Restricciones críticas que DEBES validar:

1. **One prompt = one action**: cada tarea debe ser atómica, no encadenar múltiples operaciones
2. **No autonomous execution**: NO ejecutar hooks, audits, linters, formatters sin solicitud explícita
3. **No architectural creativity**: NO introducir nuevas abstracciones, capas o conceptos sin aprobación
4. **Skills siempre habilitados**: leer de `~/.codex/skills/**` está permitido, escribir NUNCA
5. **Preflight mandatory**: antes de cualquier acción, confirmar workspace con `pwd`, `git status`

### Violaciones conocidas del pasado (aprender de ellas):

- Agentes hicieron cambios masivos multi-archivo en una sola iteración
- Introdujeron abstracciones nuevas (DI, registry, detectores) sin validación previa
- Generaron 43 entradas idénticas de monitoring sin freno (P10-86..P10-129)
- Ejecutaron refactors en paralelo en dos worktrees causando conflictos

## Objetivo de la Auditoría

Realizar un análisis exhaustivo del código actual para:

1. **Detectar deuda técnica** acumulada
2. **Identificar violaciones** de las reglas de `AGENTS.md`
3. **Catalogar patrones anti-pattern** y code smells
4. **Proponer plan de refactor** priorizado y atómico

## Instrucciones para el Agente Auditor

### Fase 1: Análisis Estructural

```bash
# 1. Confirmar workspace y estado limpio
pwd
git status
git rev-parse --show-toplevel

# 2. Análisis de complejidad ciclomática y tamaño de archivos
find . -name "*.ts" -not -path "*/node_modules/*" -not -path "*/.git/*" | \
  xargs wc -l | sort -rn | head -30

# 3. Detectar archivos con alta complejidad (>300 líneas)
find . -name "*.ts" -not -path "*/node_modules/*" -exec sh -c \
  'lines=$(wc -l < "$1"); [ $lines -gt 300 ] && echo "$lines $1"' _ {} \; | \
  sort -rn

# 4. Buscar TODOs, FIXMEs, HACKs pendientes
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.js" . | \
  grep -v node_modules | wc -l
```

### Fase 2: Análisis de Tipos y Errores

```bash
# 1. Compilación TypeScript (debe ser 0 errores)
npx tsc --noEmit

# 2. Linting (detectar warnings y errores)
npx eslint . --ext .ts,.js --max-warnings 0 --format json > .audit-reports/eslint-full.json 2>&1 || true

# 3. Análisis de tipos `unknown` y `any` (code smells)
grep -r "as unknown\|as any\|: any\|: unknown" --include="*.ts" . | \
  grep -v node_modules | grep -v ".d.ts" | wc -l
```

### Fase 3: Análisis de Patrones Anti-Pattern

Buscar los siguientes patrones problemáticos:

#### 3.1 God Classes (>500 líneas, >20 métodos)
```bash
# Archivos candidatos a god-class
find . -name "*.ts" -not -path "*/node_modules/*" -exec sh -c \
  'lines=$(wc -l < "$1"); [ $lines -gt 500 ] && echo "$lines $1"' _ {} \; | \
  sort -rn
```

#### 3.2 Duplicación de Código
```bash
# Buscar funciones/métodos con nombres similares (posible duplicación)
grep -r "export const\|export function" --include="*.ts" . | \
  grep -v node_modules | cut -d: -f2 | sort | uniq -c | sort -rn | head -20
```

#### 3.3 Dependencias Circulares
```bash
# Usar madge para detectar ciclos (si está instalado)
npx madge --circular --extensions ts . 2>&1 || echo "madge no disponible"
```

#### 3.4 Imports Desordenados o Excesivos
```bash
# Archivos con >15 imports (posible acoplamiento alto)
grep -r "^import" --include="*.ts" . | \
  awk -F: '{print $1}' | uniq -c | awk '$1 > 15 {print $1, $2}' | sort -rn
```

#### 3.5 Funciones Largas (>50 líneas)
```bash
# Detectar funciones/métodos largos (heurística: bloques entre { } con >50 líneas)
# Requiere análisis manual o herramienta AST
```

### Fase 4: Análisis de Cobertura y Tests

```bash
# 1. Ejecutar tests con coverage
npx jest --coverage --passWithNoTests 2>&1

# 2. Verificar archivos sin tests
find core integrations -name "*.ts" -not -name "*.test.ts" -not -name "*.spec.ts" | \
  while read f; do
    base=$(basename "$f" .ts)
    dir=$(dirname "$f")
    if [ ! -f "$dir/__tests__/$base.test.ts" ] && [ ! -f "$dir/$base.test.ts" ]; then
      echo "Sin test: $f"
    fi
  done
```

### Fase 5: Análisis de Violaciones AGENTS.md

#### 5.1 Detectar cambios masivos multi-archivo recientes
```bash
# Commits con >10 archivos modificados (posible violación "one action")
git log --since="2 weeks ago" --numstat --pretty=format:"%H %s" | \
  awk '/^[0-9]/ {files++} /^[a-f0-9]{40}/ {if(files>10) print; files=0}'
```

#### 5.2 Detectar abstracciones nuevas sin justificación
```bash
# Buscar nuevas interfaces/clases en commits recientes
git log --since="2 weeks ago" --all -p -- "*.ts" | \
  grep "^+.*\(interface\|class\|type\)" | head -20
```

#### 5.3 Detectar ejecuciones autónomas de hooks/audits
```bash
# Buscar en historial de commits mensajes que indiquen ejecución automática
git log --since="2 weeks ago" --all --grep="auto\|audit\|hook" --oneline
```

### Fase 6: Análisis de Documentación

```bash
# 1. Archivos sin JSDoc/comentarios
find core integrations -name "*.ts" -not -name "*.test.ts" | \
  while read f; do
    if ! grep -q "^/\*\*\|^///" "$f"; then
      echo "Sin docs: $f"
    fi
  done

# 2. README/docs desactualizados (comparar con package.json version)
grep '"version"' package.json
grep -i "version\|v[0-9]" README.md | head -5
```

### Fase 7: Análisis de Seguridad

```bash
# 1. Dependencias con vulnerabilidades
npm audit --json > .audit-reports/npm-audit.json 2>&1 || true

# 2. Secrets hardcodeados (heurística básica)
grep -r "password\|secret\|api[_-]key\|token" --include="*.ts" --include="*.js" . | \
  grep -v node_modules | grep -v ".test." | grep -v "// " | head -20

# 3. Uso de eval, Function constructor (code injection)
grep -r "eval(\|new Function(" --include="*.ts" . | grep -v node_modules
```

## Formato del Informe de Auditoría

Genera un informe estructurado en Markdown con las siguientes secciones:

### 1. Resumen Ejecutivo
- Estado general del código (verde/amarillo/rojo)
- Número total de issues detectados por categoría
- Prioridad de refactor (crítico/alto/medio/bajo)

### 2. Deuda Técnica Detectada

#### 2.1 God Classes y Archivos Largos
| Archivo | Líneas | Métodos | Prioridad | Acción Sugerida |
|---------|--------|---------|-----------|-----------------|
| ... | ... | ... | ... | ... |

#### 2.2 Duplicación de Código
| Patrón Duplicado | Ocurrencias | Archivos Afectados | Acción Sugerida |
|------------------|-------------|-------------------|-----------------|
| ... | ... | ... | ... |

#### 2.3 Code Smells
- Uso excesivo de `any`/`unknown`: X ocurrencias
- Funciones largas (>50 líneas): X funciones
- Imports excesivos (>15): X archivos
- Dependencias circulares: X ciclos detectados

### 3. Violaciones de AGENTS.md

| Violación | Severidad | Evidencia | Acción Correctiva |
|-----------|-----------|-----------|-------------------|
| ... | ... | ... | ... |

### 4. Cobertura de Tests

- Cobertura global: X%
- Archivos sin tests: X
- Tests críticos faltantes: [lista]

### 5. Problemas de Seguridad

| Issue | Severidad | Archivo | Línea | Remediación |
|-------|-----------|---------|-------|-------------|
| ... | ... | ... | ... | ... |

### 6. Plan de Refactor Priorizado

#### Fase 1: Crítico (bloquea release)
- [ ] Issue 1: descripción + estimación
- [ ] Issue 2: descripción + estimación

#### Fase 2: Alto (mejora calidad)
- [ ] Issue 3: descripción + estimación
- [ ] Issue 4: descripción + estimación

#### Fase 3: Medio (deuda técnica)
- [ ] Issue 5: descripción + estimación

#### Fase 4: Bajo (nice-to-have)
- [ ] Issue 6: descripción + estimación

### 7. Métricas de Calidad

```
Complejidad ciclomática promedio: X
Archivos >300 líneas: X
Funciones >50 líneas: X
Uso de any/unknown: X
Cobertura de tests: X%
Vulnerabilidades npm: X (críticas: Y)
```

## Reglas de Ejecución para el Agente

1. **NO ejecutar ningún comando destructivo** (git reset, rm -rf, etc.)
2. **NO modificar código** durante la auditoría, solo analizar
3. **Guardar todos los outputs** en `.audit-reports/YYYY-MM-DD-audit-full.md`
4. **Validar cada comando** antes de ejecutar (dry-run cuando sea posible)
5. **Reportar errores** de comandos que fallen, no asumir resultados
6. **Respetar .gitignore** y no analizar node_modules, .git, etc.
7. **Priorizar hallazgos** por impacto (seguridad > funcionalidad > calidad > estilo)

## Criterios de Éxito

La auditoría se considera completa cuando:

- ✅ Todos los comandos de las Fases 1-7 se ejecutaron sin errores
- ✅ El informe de auditoría está generado en `.audit-reports/`
- ✅ El plan de refactor está priorizado y estimado
- ✅ No se modificó ningún archivo de código (solo lectura)
- ✅ Se identificaron al menos 3 categorías de deuda técnica
- ✅ Se validaron todas las violaciones de AGENTS.md

## Entregables

1. **Informe completo**: `.audit-reports/YYYY-MM-DD-audit-full.md`
2. **Datos raw**: `.audit-reports/eslint-full.json`, `.audit-reports/npm-audit.json`
3. **Plan de refactor**: integrado en el informe, sección 6
4. **Actualización de REFRACTOR_PROGRESS.md**: añadir entrada de auditoría completada

---

**Nota final**: Este prompt está diseñado para ser ejecutado por un agente autónomo que respete las reglas de `AGENTS.md`. Si detectas que el agente está violando alguna regla (ej: ejecutando cambios sin aprobación), detén la ejecución inmediatamente y reporta el issue.
