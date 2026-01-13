---
paths:
  - "**/*.js"
  - "**/*.ts"
  - "**/*.swift"
---

# Regla: Gate Workflow

Antes de editar cualquier archivo de código:

1. Verificar `.AI_EVIDENCE.json` → `ai_gate.status`
2. Si `BLOCKED` → NO editar, resolver violaciones primero
3. Si `ALLOWED` → Proceder con la edición

Después de cada edición:

1. Ejecutar `npx ast-hooks audit`
2. Verificar que no se introdujeron nuevas violaciones
