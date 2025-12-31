# Alerting system (hook-system)

This repo does not expose its own HTTP server; metrics are published via `/metrics` in `metrics-server.js`, reading `.audit_tmp/hook-metrics.jsonl`. Alerts rely on `recordMetric` events from critical services (guards, scheduler).

## Key metrics
- `hook_events_total{hook="guard_auto_manager",status="lock_fail|start|stop"}`
- `hook_events_total{hook="realtime_guard",status="start|stop"}`
- `hook_events_total{hook="git_tree",status="dirty|clean"}`
- `hook_events_total{hook="token_monitor",status="start|fail"}`
- `hook_events_total{hook="gitflow_autosync",status="enabled|sync_success"}`
- `hook_events_total{hook="evidence",status="stale|auto_refresh_success"}`

## Alert examples (Prometheus)
```yaml
- alert: GuardLockFailure
  expr: increase(hook_events_total{hook="guard_auto_manager",status="lock_fail"}[5m]) > 0
  for: 5m
  labels: { severity: critical }
  annotations:
    summary: "Guard auto manager could not acquire lock"
    description: "Check duplicate instance or orphan PID file"

- alert: GitTreeDirtyPersistent
  expr: increase(hook_events_total{hook="git_tree",status="dirty"}[15m]) >= 3
  for: 0m
  labels: { severity: warning }
  annotations:
    summary: "Repo dirty repeatedly"
    description: "More than 3 dirty detections in 15m"

- alert: EvidenceStale
  expr: increase(hook_events_total{hook="evidence",status="stale"}[30m]) > 0
  for: 0m
  labels: { severity: warning }
  annotations:
    summary: "Evidence is stale"
    description: "Guard detected evidence outside SLA"

- alert: TokenMonitorFail
  expr: increase(hook_events_total{hook="token_monitor",status="fail"}[10m]) > 0
  for: 0m
  labels: { severity: warning }
  annotations:
    summary: "Token monitor failed to start"
    description: "Check script/token monitor availability"
```

## Operations
- Run `metrics-server.js` (port `HOOK_METRICS_PORT`, default 9464) to expose `/metrics`.
- Scrape Prometheus apuntando a `http://<host>:<port>/metrics`.
- Ajustar umbrales/ventanas según ruido y frecuencia de uso.
