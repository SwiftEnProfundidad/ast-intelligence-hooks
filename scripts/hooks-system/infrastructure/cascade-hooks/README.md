# 🚀 IDE Hooks + Git Pre-Commit - AST Intelligence Enforcement

## ¿Qué es esto?

Este sistema combina **IDE Hooks** (donde estén disponibles) con **Git Pre-Commit** para garantizar enforcement en CUALQUIER IDE.

### Soporte por IDE (Actualizado: Enero 2026)

| IDE | Hook Pre-Write | ¿Bloquea antes? | Exit Code | Config |
|-----|----------------|-----------------|-----------|--------|
| **Windsurf** | `pre_write_code` | ✅ SÍ | exit(2) | `~/.codeium/windsurf/cascade/hooks.json` |
| **Claude Code** | `PreToolUse` (matcher: `Write`, `Edit`) | ✅ SÍ | exit(2) | `~/.config/claude-code/settings.json` |
| **Cursor** | ❌ Solo `afterFileEdit` | ⚠️ NO (post-write) | - | `.cursor/hooks.json` |
| **Kilo Code** | ❌ No documentado | ⚠️ NO | - | - |
| **OpenCode** | ❌ No documentado | ⚠️ NO | - | - |

### Resumen de Enforcement

- ✅ **Windsurf + Claude Code**: Bloqueo REAL antes de escribir
- ⚠️ **Cursor**: Solo logging post-escritura (requiere Git pre-commit)
- ⚠️ **Otros IDEs**: Solo Git pre-commit

**El Git pre-commit es el fallback 100% garantizado para TODOS los IDEs.**

## Instalación

### 1. Copiar configuración a Windsurf

Copia el contenido de `cascade-hooks-config.json` a tu configuración de Windsurf:

```bash
# En macOS
mkdir -p ~/.codeium/windsurf/cascade
cp cascade-hooks-config.json ~/.codeium/windsurf/cascade/hooks.json
```

O abre Windsurf Settings y busca "Cascade Hooks".

### 2. Hacer ejecutable el hook

```bash
chmod +x pre-write-code-hook.js
chmod +x post-write-code-hook.js
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
- `cascade-hooks-config.json` - Configuración para copiar a Windsurf

---
Pumuki Team® - AST Intelligence
