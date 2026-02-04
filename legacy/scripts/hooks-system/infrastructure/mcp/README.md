<p align="center">
   <img src="../../assets/logo.png" alt="PUMUKI - AST Intelligence" width="150" />
 </p>

# MCP Server: AI Evidence Watcher

## 🎯 Objetivo

**Notificar automáticamente a la IA (no al usuario) cuando `.AI_EVIDENCE.json` está stale**, para que la IA pueda actualizar el evidence automáticamente sin intervención manual.

## 🔄 Diferencia con Watchdog

| Component | Propósito | Target |
|-----------|-----------|--------|
| **Watchdog** (`ai-watchdog.sh`) | Notificar a Carlos vía macOS | 👤 Usuario |
| **MCP Server** (`evidence-watcher.js`) | Notificar a la IA vía Cursor | 🤖 IA |

## 📡 Protocolo MCP (Model Context Protocol)

El MCP permite a la IA en Cursor:
1. **Leer recursos** (como el estado del evidence)
2. **Llamar herramientas** (como check_evidence_status)

**Sin MCP:**
```
Usuario → ai-start → actualiza evidence → IA puede trabajar
```

**Con MCP:**
```
IA detecta evidence stale vía MCP → IA actualiza automáticamente → Usuario trabaja directamente
```

## 🚀 Recursos Expuestos

### `evidence://status`
Estado actual del `.AI_EVIDENCE.json`:

```json
{
  "status": "stale|fresh|missing|error",
  "message": "Evidence is STALE (350s old, max 180s)",
  "action": "Run: ai-start develop",
  "age": 350,
  "isStale": true,
  "timestamp": "2025-11-06T14:33:45Z",
  "session": "develop",
  "currentBranch": "develop"
}
```

## 🛠️ Herramientas Expuestas

### `check_evidence_status`
Chequea si el evidence está stale:

**Input:** Ninguno  
**Output:** Mismo que `evidence://status`

## ⚙️ Configuración

El MCP server se configura en `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ai-evidence-watcher": {
      "command": "node",
      "args": [
        "${workspaceFolder}/scripts/hooks-system/infrastructure/mcp/evidence-watcher.js"
      ],
      "env": {
        "REPO_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

## 🧪 Testing

```bash
# Test manual (simula lo que hace Cursor)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
  node scripts/hooks-system/infrastructure/mcp/evidence-watcher.js

# Expected output: initialize response

echo '{"jsonrpc":"2.0","id":2,"method":"resources/read","params":{"uri":"evidence://status"}}' | \
  REPO_ROOT=$(pwd) node scripts/hooks-system/infrastructure/mcp/evidence-watcher.js
```

## 📝 Cómo lo Usa la IA

Cuando Cursor arranca:
1. **Cursor inicia el MCP server** automáticamente
2. **La IA consulta** `evidence://status` o llama `check_evidence_status`
3. **Si está stale:** La IA puede:
   - Avisar al usuario: "⚠️ Evidence stale, actualiza con ai-start develop"
   - **Futuro:** Actualizar automáticamente el evidence (requiere tool de escritura)

## 🔮 Futuras Mejoras

1. **Tool `update_evidence`**: Permitir a la IA actualizar el evidence directamente
2. **Push notifications**: En lugar de polling, usar `fswatch` para notificar cambios
3. **Integración con rules**: Sugerir qué reglas .mdc leer según archivos modificados

## 🐈 Pumuki Dice

> **"Ahora la IA (yo) puede saber automáticamente cuando el evidence está viejo, sin que Carlos tenga que acordarse. ¡Automatización nivel 💯!"**

---

**Created:** 2025-11-06  
**Version:** 1.0.0  
**Author:** Carlos Merlos + IA 🤝
