---
name: pumuki-audit-workflow
description: Ejecuta el flujo completo de auditoría y validación antes de commit o al finalizar una tarea.
metadata:
  short-description: Auditoría y Definition of Done
---

## Activación

Usar este skill cuando:
- Antes de hacer commit
- Usuario dice: "pasar auditoría", "definition of done", "verificar calidad"
- Al finalizar una tarea o feature

## Instrucciones

### 1. Ejecutar tests

```bash
npm test
```

Si fallan → Corregir antes de continuar

### 2. Ejecutar linter

```bash
npm run lint
```

Si hay errores → Corregir antes de continuar

### 3. Actualizar evidencia

```bash
npx ast-hooks audit
```

### 4. Verificar gate final

Ejecutar MCP tool `ai_gate_check()`:

- `ALLOWED` → Definition of Done cumplido
- `BLOCKED` → Resolver violaciones pendientes

## Definition of Done Checklist

- [ ] Tests pasan
- [ ] Lint sin errores
- [ ] Gate status = ALLOWED
- [ ] `.AI_EVIDENCE.json` actualizado

## Output

```
✅ Tests: PASSED
✅ Lint: OK
✅ Gate: ALLOWED
✅ Evidence: FRESH
✅ Definition of Done: CUMPLIDO
```
