# 🚀 IDE Hooks + Git Pre-Commit - AST Intelligence Enforcement

## ¿Qué es esto?

Este sistema combina **IDE Hooks** (donde estén disponibles) con **Git Pre-Commit** para garantizar enforcement en CUALQUIER IDE.

### Soporte por IDE (Actualizado: Enero 2026)

| IDE | Hook Pre-Write | ¿Bloquea antes? | Mecanismo | Config |
|-----|----------------|-----------------|-----------|--------|
| **Windsurf** | `pre_write_code` | ✅ SÍ | exit(2) | `~/.codeium/windsurf/hooks.json` |
| **Claude Code** | `PreToolUse` (Write/Edit) | ✅ SÍ | exit(2) | `~/.config/claude-code/settings.json` |
| **OpenCode** | Plugin `tool.execute.before` | ✅ SÍ | throw Error | `opencode.json` o `~/.config/opencode/opencode.json` |
| **Codex CLI** | ❌ Solo approval policies | ⚠️ NO (manual) | - | `~/.codex/config.toml` |
| **Cursor** | ❌ Solo `afterFileEdit` | ⚠️ NO (post-write) | - | `.cursor/hooks.json` |
| **Kilo Code** | ❌ No documentado | ⚠️ NO | - | - |

### Resumen de Enforcement

- ✅ **Windsurf + Claude Code + OpenCode**: Bloqueo REAL antes de escribir
- ⚠️ **Codex CLI**: Requiere aprobación manual (no automatizable)
- ⚠️ **Cursor**: Solo logging post-escritura (requiere Git pre-commit)
- ⚠️ **Otros IDEs**: Solo Git pre-commit

**El Git pre-commit es el fallback 100% garantizado para TODOS los IDEs.**

## Instalación

### 1. Configurar Windsurf Hooks

Crea el archivo `~/.codeium/windsurf/hooks.json` con el siguiente contenido:

```json
{
  "hooks": {
    "pre_write_code": [
      {
        "command": "bash \"/RUTA/A/TU/PROYECTO/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh\" pre-write-code-hook.js",
        "show_output": true
      }
    ],
    "post_write_code": [
      {
        "command": "bash \"/RUTA/A/TU/PROYECTO/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh\" post-write-code-hook.js",
        "show_output": true
      }
    ]
  }
}
```

**Importante**: Reemplaza `/RUTA/A/TU/PROYECTO` con la ruta absoluta a tu proyecto.

Para evitar rutas obsoletas, puedes generar el JSON directamente desde este repo:

```bash
npm run print:windsurf-hooks-config > ~/.codeium/windsurf/hooks.json
```

O instalarlo automáticamente (con backup del `hooks.json` previo):

```bash
npm run install:windsurf-hooks-config
```

Verificar wiring + runtime antes de abrir Windsurf:

```bash
npm run verify:windsurf-hooks-runtime
```

Para previsualizar sin escribir:

```bash
bash scripts/hooks-system/infrastructure/cascade-hooks/install-windsurf-hooks-config.sh --dry-run
```

El wrapper `run-hook-with-node.sh` intenta resolver Node en este orden:

- `NODE_BINARY` explícito
- `node` en `PATH`
- runtimes comunes (`nvm`, `volta`, `asdf`, `fnm`, Homebrew)

Si no encuentra Node, muestra diagnóstico y sale en modo compatibilidad (no bloquea la escritura).

Modo estricto opcional:

- `PUMUKI_HOOK_STRICT_NODE=1` cambia el fallback de compatibilidad a bloqueo (`exit 2`) cuando no hay runtime Node.
- Recomendado habilitarlo solo cuando el entorno ya está estabilizado.

Diagnóstico explícito:

```bash
bash "/RUTA/A/TU/PROYECTO/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh" --diagnose
```

También puedes activar diagnóstico en cada ejecución de hook con:

- `PUMUKI_HOOK_DIAGNOSTIC=1`

El diagnóstico imprime `node_bin`, `node_version`, `PATH` efectivo y flags de strict/diagnostic.

Para capturar un paquete de diagnóstico local (wrapper + smoke test `post_write_code`):

```bash
bash "/RUTA/A/TU/PROYECTO/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh"
```

El script genera logs en `.audit_tmp/` listos para adjuntar en soporte.

Para ejecutar validación local completa (`pre_write_code` + `post_write_code` simulados):

```bash
npm run validate:windsurf-hooks-local
```

Genera artefactos en `docs/validation/windsurf/artifacts/`.

**Reinicia Windsurf** después de crear el archivo.

### Estrategia de rollout recomendada

1. **Fase 1 (compatibilidad por defecto)**  
   Mantén `PUMUKI_HOOK_STRICT_NODE` desactivado para evitar bloqueos mientras estabilizas entorno.
2. **Fase 2 (diagnóstico activo)**  
   Activa `PUMUKI_HOOK_DIAGNOSTIC=1` temporalmente y recoge logs para confirmar resolución estable de Node.
3. **Fase 3 (enforcement estricto)**  
   Activa `PUMUKI_HOOK_STRICT_NODE=1` cuando los diagnósticos sean estables en tu equipo/CI.

### 2. Hacer ejecutable el hook

```bash
chmod +x pre-write-code-hook.js
chmod +x post-write-code-hook.js
chmod +x run-hook-with-node.sh
```

### 3. Verificar instalación

Intenta escribir código con un `catch {}` vacío - debería ser bloqueado.

## Cómo funciona

```
┌─────────────────────────────────────────────────────────────────┐
│  AI genera código                                                │
│                          ↓                                       │
│  Windsurf ejecuta pre_write_code hook                           │
│                          ↓                                       │
│  Hook recibe: { file_path, edits: [{ old_string, new_string }] }│
│                          ↓                                       │
│  analyzeCodeInMemory(new_string, file_path)                     │
│                          ↓                                       │
│  ¿Violaciones críticas? ──YES──→ exit(2) ─→ ❌ BLOQUEADO        │
│          │                                                       │
│          NO                                                      │
│          ↓                                                       │
│  exit(0) ─→ ✅ Código se escribe                                │
└─────────────────────────────────────────────────────────────────┘
```

## Reglas bloqueadas

El hook bloquea código que contenga:

| Patrón | Regla | Mensaje |
|--------|-------|---------|
| `catch {}` | common.error.empty_catch | Empty catch block - always log or propagate |
| `.shared` | common.singleton | Singleton pattern - use DI |
| `DispatchQueue.main` | ios.concurrency.gcd | GCD detected - use async/await |
| `@escaping` | ios.concurrency.completion_handler | Completion handler - use async/await |
| `ObservableObject` | ios.swiftui.observable_object | Use @Observable (iOS 17+) |
| `AnyView` | ios.swiftui.any_view | AnyView affects performance |

## Logs

Los logs se guardan en:

- `.audit_tmp/cascade-hook.log` - Logs del hook
- `.audit_tmp/cascade-writes.log` - Historial de escrituras

## Archivos

- `pre-write-code-hook.js` - Hook principal que BLOQUEA violaciones
- `post-write-code-hook.js` - Hook de logging post-escritura
- `run-hook-with-node.sh` - Wrapper que resuelve runtime Node de forma robusta
- `cascade-hooks-config.json` - Configuración para copiar a Windsurf

---
Pumuki Team® - AST Intelligence
