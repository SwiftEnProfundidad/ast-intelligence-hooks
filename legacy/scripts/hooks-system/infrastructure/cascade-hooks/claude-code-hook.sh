#!/bin/bash
# =============================================================================
# 🚀 Claude Code Hook - PreToolUse (Write/Edit)
# =============================================================================
#
# Este hook se ejecuta ANTES de que Claude Code escriba o edite archivos.
# Usa AST Intelligence para validar el código propuesto y BLOQUEAR
# si hay violaciones críticas.
#
# Configuración en ~/.config/claude-code/settings.json:
# {
#   "hooks": {
#     "PreToolUse": [
#       {
#         "matcher": "Write",
#         "hooks": [{ "type": "command", "command": "/path/to/claude-code-hook.sh" }]
#       },
#       {
#         "matcher": "Edit", 
#         "hooks": [{ "type": "command", "command": "/path/to/claude-code-hook.sh" }]
#       }
#     ]
#   }
# }
#
# Exit codes:
# - 0: Permitir escritura
# - 2: BLOQUEAR escritura (violaciones críticas)
#
# Author: Pumuki Team®
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"
LOG_FILE="$REPO_ROOT/.audit_tmp/claude-code-hook.log"

log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    if [ -n "$DEBUG" ]; then
        echo "[$timestamp] [$level] $message" >&2
    fi
}

# Leer JSON de stdin
input=$(cat)

log "INFO" "Claude Code hook triggered"

# Extraer tool_name del input
tool_name=$(echo "$input" | jq -r '.tool_name // .tool // "unknown"' 2>/dev/null || echo "unknown")
log "INFO" "Tool: $tool_name"

# Solo procesar Write y Edit
if [[ "$tool_name" != "Write" && "$tool_name" != "Edit" ]]; then
    log "INFO" "Skipping non-write tool: $tool_name"
    exit 0
fi

# Extraer file_path y content
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .file_path // ""' 2>/dev/null || echo "")
content=$(echo "$input" | jq -r '.tool_input.content // .content // ""' 2>/dev/null || echo "")

if [ -z "$file_path" ]; then
    log "WARN" "No file_path in input"
    exit 0
fi

log "INFO" "Analyzing: $file_path"

# Skip test files (TDD allowed)
if [[ "$file_path" =~ \.(spec|test)\.(js|ts|swift|kt)$ ]]; then
    log "INFO" "TDD: Test file allowed: $file_path"
    exit 0
fi

# Ejecutar análisis AST si hay contenido
if [ -n "$content" ]; then
    # Llamar al analizador Node.js
    analysis_result=$(echo "$content" | node -e "
        const path = require('path');
        const repoRoot = '$REPO_ROOT';
        const filePath = '$file_path';
        
        let input = '';
        process.stdin.on('data', chunk => input += chunk);
        process.stdin.on('end', () => {
            try {
                const { analyzeCodeInMemory } = require(path.join(repoRoot, 'scripts/hooks-system/infrastructure/ast/ast-core'));
                const result = analyzeCodeInMemory(input, filePath);
                console.log(JSON.stringify(result));
            } catch (e) {
                console.log(JSON.stringify({ success: false, error: e.message, hasCritical: false }));
            }
        });
    " 2>/dev/null || echo '{"success":false,"hasCritical":false}')

    has_critical=$(echo "$analysis_result" | jq -r '.hasCritical // false' 2>/dev/null || echo "false")

    if [ "$has_critical" = "true" ]; then
        violations=$(echo "$analysis_result" | jq -r '.violations[] | select(.severity == "CRITICAL") | "  ❌ [\(.ruleId)] \(.message)"' 2>/dev/null || echo "Unknown violations")
        
        log "BLOCKED" "Critical violations in $file_path"
        
        # Salida a stderr para que Claude Code la procese
        echo "" >&2
        echo "🚫 AST INTELLIGENCE BLOCKED THIS WRITE" >&2
        echo "═══════════════════════════════════════" >&2
        echo "File: $file_path" >&2
        echo "" >&2
        echo "$violations" >&2
        echo "" >&2
        echo "Fix these violations before writing." >&2
        echo "═══════════════════════════════════════" >&2
        
        exit 2  # BLOQUEAR
    fi
fi

log "ALLOWED" "No critical violations in $file_path"
exit 0
