#!/bin/bash
# ===== SESSION CONTEXT UPDATER =====
# Actualiza .AI_SESSION_START.md automáticamente después de cada commit
# Se ejecuta como post-commit hook

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Obtener información actual
BRANCH=$(git branch --show-current)
ISSUE=$(echo "$BRANCH" | grep -oE '[0-9]+' | head -1)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
VIOLATIONS_HIGH=$(cat .audit_tmp/ast-summary.json 2>/dev/null | jq '.summary.high // 0' || echo "0")
FILES_MODIFIED=$(git diff --name-only origin/develop...HEAD 2>/dev/null | wc -l | tr -d ' ' || echo "0")
COMMITS_TODAY=$(git log --since="today" --oneline 2>/dev/null | wc -l | tr -d ' ' || echo "0")

# Determinar fase actual
PHASE="2.1"
PHASE_NAME="Violations cleanup (Small files)"
PROGRESS="15%"

if [ -z "$ISSUE" ]; then
    ISSUE="185"
fi

# Derivar etiqueta de sesión desde .AI_EVIDENCE.json si existe
SESSION_LABEL=""
EVIDENCE_FILE=".AI_EVIDENCE.json"
if [ -f "$EVIDENCE_FILE" ]; then
    SESSION_ID=$(jq -r '.session_id // empty' "$EVIDENCE_FILE" 2>/dev/null || echo "")
    SESSION_ACTION=$(jq -r '.action // empty' "$EVIDENCE_FILE" 2>/dev/null || echo "")
    if [ -n "$SESSION_ID" ]; then
        if [ -n "$SESSION_ACTION" ] && [ "$SESSION_ACTION" != "null" ]; then
            SESSION_LABEL="$SESSION_ID - $SESSION_ACTION"
        else
            SESSION_LABEL="$SESSION_ID"
        fi
    fi
fi

if [ -z "$SESSION_LABEL" ]; then
    SESSION_LABEL="#$ISSUE - Fix any types (small files)"
fi

# Obtener archivos staged/modificados
STAGED_FILES=$(git diff --name-only --cached 2>/dev/null || echo "")
if [ -z "$STAGED_FILES" ]; then
    STAGED_FILES=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | head -10 || echo "Sin cambios")
fi

# Obtener últimos commits
LAST_COMMITS=$(git log --oneline -3 2>/dev/null || echo "Sin commits recientes")

# Generar archivo actualizado
cat > .AI_SESSION_START.md <<EOF
# 🚨 NUEVA SESIÓN - LEER PRIMERO 🚨

## ⚠️ SI ESTÁS EN UNA NUEVA VENTANA DE CONTEXTO, EJECUTA ESTE PROTOCOLO:

**Última actualización:** $TIMESTAMP
**Sesión actual:** $SESSION_LABEL

---

## 📋 PASO 1: LEER REGLAS (OBLIGATORIO)

**ANTES de modificar código, LEER:**
- [ ] \`.cursor/rules/rulesfront.mdc\` (líneas 119-142 - Clean Architecture)
- [ ] \`.cursor/rules/rulesbackend.mdc\` (Repository pattern, Use Cases)
- [ ] \`.cursor/rules/rulesios.mdc\` (SwiftUI, MVVM, Protocol-Oriented)
- [ ] \`.cursor/rules/rulesandroid.mdc\` (Jetpack Compose, MVVM, Hilt)

**ACTUALIZAR:**
- [ ] \`.AI_EVIDENCE.json\` con timestamp actual
- [ ] Responder 3 preguntas del protocolo

**Enforcement:**
- ✅ \`pre-commit\` valida \`.AI_EVIDENCE.json\` (< 10 min antigüedad)
- ✅ \`pre-commit\` valida Clean Architecture (forbidden dirs)
- ✅ \`pre-commit\` valida Git Flow (16 steps)
- ⛔ COMMIT BLOQUEADO si no cumples protocolo

---

## 🗺️ PASO 2: CONTEXTO GITHUB (Links rápidos)

**Issues principales:**
- 🔗 [Issue #1 - RULES](https://github.com/juancarlosmerlosalbarracin/RuralGO/issues/1) - Reglas y protocolo (Pinned)
- 🔗 [Issue #2 - ROADMAP](https://github.com/juancarlosmerlosalbarracin/RuralGO/issues/2) - Plan completo v1.0.0 (Milestone)
- 🔗 [Issue #$ISSUE - ACTUAL](https://github.com/juancarlosmerlosalbarracin/RuralGO/issues/$ISSUE) - Fix any types - Small files

---

## 📊 PASO 3: ESTADO ACTUAL DE LA SESIÓN

### Branch activo:
\`\`\`bash
$BRANCH
\`\`\`

### Fase del plan:
**Fase $PHASE** - $PHASE_NAME
- **Progreso total:** $PROGRESS
- **Commits hoy:** $COMMITS_TODAY
- **Files modificados:** $FILES_MODIFIED
- **Violations HIGH restantes:** $VIOLATIONS_HIGH

### Archivos modificados recientemente:
\`\`\`
$STAGED_FILES
\`\`\`

### Últimos 3 commits:
\`\`\`
$LAST_COMMITS
\`\`\`

---

## 🎯 PASO 4: PRÓXIMOS PASOS (Continuar desde aquí)

### Inmediato (esta sesión):
1. **Verificar estado:** \`git status\`
2. **Continuar cleanup:** Próximos 10 archivos pequeños
3. **Actualizar Issue #$ISSUE** con progreso

### Próxima sesión (Issue #186):
- Archivos medium (100-500 líneas)
- Estimación: ~800K tokens
- 30 files, ~100 any types

### Bloqueadores:
**Ninguno** - Path despejado para continuar

---

## 📈 MÉTRICAS GLOBALES

**Violations restantes:**
- 🔴 CRITICAL: 0
- 🟠 HIGH: $VIOLATIONS_HIGH (objetivo: <100)
- 🟡 MEDIUM: ~8,450
- 🔵 LOW: ~12,300

**Progreso fases:**
- ✅ Fase 1: Git Flow + AI Protocol (100%)
- 🔄 Fase 2: Violations cleanup ($PROGRESS)
- 📋 Fase 3: iOS Setup (0%)
- 📋 Fase 4: Android Setup (0%)
- 📋 Fase 5: Testing & Docs (0%)

**Target v1.0.0:** 2025-12-31

---

## 🔧 COMANDOS ÚTILES (Verificación rápida)

\`\`\`bash
# Ver estado
git status
git branch --show-current
git log --oneline -5

# Verificar protocolo
cat .AI_EVIDENCE.json | jq '.timestamp'
cat .AI_EVIDENCE.json | jq '.protocol_3_questions.answered'

# Ver violations actuales
bash scripts/hooks-system/presentation/cli/audit.sh

# Actualizar este archivo manualmente
bash scripts/update-session-context.sh
\`\`\`

---

## ✅ CHECKLIST DE INICIO DE SESIÓN

Marca cuando completes:
- [ ] Leído \`.AI_SESSION_START.md\` (este archivo)
- [ ] Leído reglas \`.mdc\` aplicables
- [ ] Actualizado \`.AI_EVIDENCE.json\`
- [ ] Verificado branch actual
- [ ] Verificado archivos staged
- [ ] Listo para continuar trabajo

**Una vez completado, responde:**
"✅ Contexto cargado, continuamos con [describe tarea actual]"

---

## 📚 ARQUITECTURA CLEAN (Recordatorio rápido)

\`\`\`
✅ CORRECTO:
infrastructure/
  ├── config/              ← Configuración (i18n, API, env)
  ├── services/            ← Servicios externos (CSV, APIs)
  └── repositories/        ← Implementaciones de datos

application/
  ├── use-cases/           ← Lógica de negocio
  └── dtos/                ← Data Transfer Objects

domain/
  ├── entities/            ← Modelos de negocio
  └── repositories/        ← Interfaces (NO implementaciones)

presentation/
  ├── hooks/               ← Custom React hooks
  ├── stores/              ← Zustand/Redux
  └── components/          ← UI components

❌ PROHIBIDO:
lib/          → usar infrastructure/ o domain/
utils/        → usar application/ o infrastructure/
helpers/      → usar application/use-cases/
\`\`\`

---

## 🚨 PRINCIPIO FUNDAMENTAL

**"Measure twice, cut once"**
→ LEER reglas + VERIFICAR estructura + PREGUNTAR si duda
→ SOLO ENTONCES crear/modificar archivos

---

**Archivo auto-actualizado por:** \`scripts/update-session-context.sh\`
**Frecuencia:** Cada commit (post-commit hook)
**Última ejecución:** $TIMESTAMP
EOF

echo -e "${GREEN}✅ .AI_SESSION_START.md actualizado${NC}"
echo -e "${BLUE}📊 Estado: $FILES_MODIFIED files modificados, $VIOLATIONS_HIGH HIGH violations${NC}"

# OPCIONAL: Si existe gh CLI, actualizar también GitHub issue
if command -v gh &> /dev/null && [ -n "$ISSUE" ]; then
    gh issue comment "$ISSUE" --body "🔄 **Progreso actualizado:** $TIMESTAMP

📊 **Métricas:**
- Files modificados: $FILES_MODIFIED
- Commits hoy: $COMMITS_TODAY
- Violations HIGH: $VIOLATIONS_HIGH

🌿 **Branch:** \`$BRANCH\`

_Auto-updated by update-session-context.sh_" 2>/dev/null && \
    echo -e "${GREEN}✅ GitHub issue #$ISSUE actualizado${NC}" || \
    echo -e "${BLUE}ℹ️  GitHub issue no actualizado (gh CLI no disponible o sin permisos)${NC}"
fi

exit 0
