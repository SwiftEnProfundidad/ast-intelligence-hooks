# Monitoring & Alerts

## Exportador Prometheus

- Script: `scripts/hooks-system/infrastructure/telemetry/metrics-server.js`
- Puerto por defecto: `9464` (configurable mediante `HOOK_METRICS_PORT`).
- Exposición: `http://localhost:9464/metrics`

```bash
HOOK_METRICS_PORT=9465 scripts/hooks-system/infrastructure/telemetry/metrics-server.js
```

Salida ejemplo:

```
# HELP hook_events_total Total number of hook events
# TYPE hook_events_total counter
hook_events_total{hook="autonomous-orchestrator",status="success"} 5
hook_events_total{hook="autonomous-orchestrator",status="failure"} 1
```

## Integración futura

- Registrar métricas de latencia y colas (Phase 4).
- Añadir alertas (Slack/Teams) cuando la tasa de fallos supere umbrales.
- Conectar con Grafana dashboards.
