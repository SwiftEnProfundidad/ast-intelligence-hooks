# Playbooks de Auto-Recuperación

## Objetivo

Automatizar acciones correctivas frecuentes (refresh de evidencia, smoke tests, etc.).

## Configuración

- Archivo: `scripts/hooks-system/config/playbooks.json`
- Formato: JSON con `description` y lista de `steps` (por ahora solo tipo `command`).

Ejemplo:

```json
{
  "validate-ai-evidence": {
    "description": "Refresca la evidencia",
    "steps": [
      { "type": "command", "cmd": "scripts/hooks-system/bin/update-evidence.sh --auto --platforms 1,2,3,4" }
    ]
  }
}
```

## Ejecución

```bash
scripts/hooks-system/bin/run-playbook.js --list
scripts/hooks-system/bin/run-playbook.js validate-ai-evidence
```

## Roadmap

- Añadir tipos de pasos adicionales (`script`, `notification`).
- Integrar con orquestador para ejecución automática tras fallos.
- Registrar resultados en métricas (`hook: playbook-run`).
