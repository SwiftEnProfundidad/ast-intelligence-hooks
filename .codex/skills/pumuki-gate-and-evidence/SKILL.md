---
name: pumuki-gate-and-evidence
description: Gestiona el gate check y la evidencia del sistema Pumuki al inicio de sesión o antes de editar código.
metadata:
  short-description: Gate check y evidencia Pumuki
---

## Activación

Usar este skill cuando:
- Inicio de sesión de trabajo
- Antes de editar código
- Usuario dice: "abre sesión", "empezar tarea", "antes de editar"

## Instrucciones

### 1. Gate Check (OBLIGATORIO)

Ejecutar MCP tool `ai_gate_check()`:

- `ALLOWED` → Continuar con el trabajo
- `BLOCKED` → NO editar, resolver violaciones primero

### 2. Si BLOCKED

1. Leer `.AI_EVIDENCE.json` → `ai_gate.violations`
2. Ordenar: CRITICAL > HIGH > MEDIUM > LOW
3. Proponer fixes para cada violación
4. Re-ejecutar `ai_gate_check()` después de cada fix

### 3. Verificar Guard Daemon

```bash
npm run ast:guard:status
```

Si no está corriendo:

```bash
npm run ast:guard:start
```

## Output

- ✅ Gate status: ALLOWED
- ✅ Guard daemon: running
- ✅ Listo para editar código
