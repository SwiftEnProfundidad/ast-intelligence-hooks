# Observability (Prometheus) - hook-system

The hook-system exposes plaintext metrics via `/metrics` (`infrastructure/telemetry/metrics-server.js`). Metrics are based on `hook_events_total` emitted by `recordMetric` from critical services (GuardAutoManager, RealtimeGuardService, HookSystemScheduler, etc.).

## Exposure
- Run `metrics-server.js` (port `HOOK_METRICS_PORT`, default 9464).
- Data source: `.audit_tmp/hook-metrics.jsonl` (append-only).
- Endpoint: `http://<host>:<port>/metrics`.

## Available metrics (main)
- `hook_events_total{hook="guard_auto_manager",status="lock_fail|start|stop"}`
- `hook_events_total{hook="realtime_guard",status="start|stop"}`
- `hook_events_total{hook="git_tree",status="dirty|clean"}`
- `hook_events_total{hook="token_monitor",status="start|fail"}`
- `hook_events_total{hook="gitflow_autosync",status="enabled|sync_success"}`
- `hook_events_total{hook="evidence",status="stale|auto_refresh_success"}`
- `hook_events_total{hook="autonomous-orchestrator",status="success|failure"}`

## Prometheus scrape (example)
```yaml
scrape_configs:
  - job_name: 'hook-system'
    metrics_path: /metrics
    static_configs:
      - targets: ['localhost:9464']
```

## Base dashboard (Grafana example)
- Panel 1: "Guard status" -> `increase(hook_events_total{hook="guard_auto_manager"}[5m])`
- Panel 2: "Git tree dirty" -> `increase(hook_events_total{hook="git_tree",status="dirty"}[15m])`
- Panel 3: "Evidence stale" -> `increase(hook_events_total{hook="evidence",status="stale"}[30m])`
- Panel 4: "Token monitor fails" -> `increase(hook_events_total{hook="token_monitor",status="fail"}[10m])`

## Notes
- Adjust window sizes `[]` based on noise/usage.
- `.audit_tmp/hook-metrics.jsonl` can be rotated externally if it grows too much; `/metrics` recomputes from the current file.
