# Troubleshooting

Checklist de problemas frecuentes y cómo resolverlos.

## Evidence

- **Síntoma**: `evidence.status` es `stale` en `ast-hooks health`.
  - **Acción**: Ejecutar `ai-start` o el script que actualice `.AI_EVIDENCE.json`.

- **Síntoma**: `evidence.status` es `invalid`.
  - **Acción**: Revisar que el JSON tenga `timestamp` y formato válido.

## AST Watcher

- **Síntoma**: `astWatch.running` es `false`.
  - **Acción**: Ejecutar `ast-hooks watch` desde la raíz del repo.

> TODO: Añadir más casos para MCP, Git Flow y reglas AST.
