# Predictive Automation Stub

## Objetivo

Anticipar validaciones que probablemente fallen antes de ejecutar los hooks, reduciendo iteraciones.

## Componentes actuales

- `PredictiveHookAdvisor` (`scripts/hooks-system/application/services/PredictiveHookAdvisor.js`): analiza métricas históricas (`.audit_tmp/hook-metrics.jsonl`).
- CLI `scripts/hooks-system/bin/predictive-hooks.js`: muestra ranking de hooks con probabilidad de fallo >30%.

## Uso

```bash
scripts/hooks-system/bin/predictive-hooks.js
```

Salida esperada:

```
Predictive hook suggestions:
- validate-ai-evidence: 42.0% failure rate (21/50)
```

## Roadmap

- Alimentar modelo con features adicionales (tamaño de commit, plataformas afectadas).
- Integrar con orquestador (Phase 2) para ejecutar validadores preventivamente.
- Registrar decisiones en métricas (`hook: predictive-hooks`).
