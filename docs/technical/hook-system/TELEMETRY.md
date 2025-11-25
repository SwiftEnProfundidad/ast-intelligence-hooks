# Hook-System Telemetry Foundation

## Objetivo

Registrar métricas de ejecución (tiempo, estado, hook) en `.audit_tmp/hook-metrics.jsonl` para habilitar dashboards y alertas.

## Componentes

- `scripts/hooks-system/infrastructure/telemetry/metrics-logger.js`: módulo Node que permite registrar métricas vía API o CLI.
- Archivo de almacenamiento: `.audit_tmp/hook-metrics.jsonl` (JSONL, una línea por métrica).

## Uso

### Programático

```js
const { recordMetric } = require('../../scripts/hooks-system/infrastructure/telemetry/metrics-logger');

const result = recordMetric({
  hook: 'validate-ai-evidence',
  status: 'success',
  durationMs: 135,
});
console.log(result);
```

### Línea de comandos

```bash
node scripts/hooks-system/infrastructure/telemetry/metrics-logger.js \
  --hook validate-ai-evidence --status success --duration 135
```

## Próximos pasos (Phase 2+)

- Consolidar pipeline ETL nocturno que agregue métricas y genere dashboards.
- Exponer endpoint Prometheus/Pushgateway (Phase 4 `monitoring-alerts`).
- Enriquecer payload con metadatos (branch, autor, tamaño del commit).
